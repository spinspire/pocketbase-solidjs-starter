#!/bin/sh
set -e

APP_DIR=$(dirname "$0")
cd "$APP_DIR"

for cmd in wget unzip; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "Error: required tool '$cmd' is not installed" >&2
    exit 1
  fi
done

if [ -f ./.env ]; then
  . ./.env
fi

# ---------------------------------------------------------------------------
# Download PocketBase binary if not present
# ---------------------------------------------------------------------------
if [ ! -x ./pocketbase ]; then
    echo "PocketBase not found. Downloading..."

    ARCH=$(uname -m)
    case "$ARCH" in
        x86_64) PB_ARCH="amd64" ;;
        aarch64|arm64) PB_ARCH="arm64" ;;
        *) echo "Unsupported architecture: $ARCH"; exit 1 ;;
    esac

    PB_VERSION="${PB_VERSION:-0.40.3}"

    wget -q -O /tmp/pocketbase.zip \
        "https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_${PB_ARCH}.zip"
    unzip -o -d /tmp/pocketbase /tmp/pocketbase.zip > /dev/null 2>&1
    cp /tmp/pocketbase/pocketbase ./pocketbase
    chmod +x ./pocketbase
    rm -rf /tmp/pocketbase /tmp/pocketbase.zip
fi

# ---------------------------------------------------------------------------
# Superuser bootstrap – uses the CLI to create/upsert a superuser directly
# in the database (no server needed). Generates a random password if
# PB_SUPERUSER_PASSWORD is not set.
#
# Optional env vars:
#   PB_SUPERUSER_EMAIL      – email for the superuser (required)
#   PB_SUPERUSER_PASSWORD   – if set, use this instead of generating random
# ---------------------------------------------------------------------------
if [ -n "${PB_SUPERUSER_EMAIL}" ]; then
    if [ -z "${PB_SUPERUSER_PASSWORD}" ]; then
        PB_SUPERUSER_PASSWORD=$(tr -dc 'a-zA-Z0-9' < /dev/urandom | fold -w 32 | head -n 1)
        echo "PB_SUPERUSER_PASSWORD=${PB_SUPERUSER_PASSWORD}" >> ./.env
    fi

    if ./pocketbase superuser upsert "${PB_SUPERUSER_EMAIL}" "${PB_SUPERUSER_PASSWORD}" > /dev/null 2>&1; then
        echo ">>> Superuser: ${PB_SUPERUSER_EMAIL} / ${PB_SUPERUSER_PASSWORD}"
    fi
fi

# ---------------------------------------------------------------------------
# Test-user defaults + password – falls back to the superuser credentials
# when not specified. The user record itself is created by
# pb_hooks/bootstrap.pb.js at serve time (needs a running server, unlike
# the superuser CLI above).
#
# Optional env vars:
#   PB_TESTUSER_EMAIL       – defaults to PB_SUPERUSER_EMAIL
#   PB_TESTUSER_PASSWORD    – defaults to PB_SUPERUSER_PASSWORD, else random
# ---------------------------------------------------------------------------
: "${PB_TESTUSER_EMAIL:=${PB_SUPERUSER_EMAIL}}"
: "${PB_TESTUSER_PASSWORD:=${PB_SUPERUSER_PASSWORD}}"
if [ -n "${PB_TESTUSER_EMAIL}" ] && [ -z "${PB_TESTUSER_PASSWORD}" ]; then
    PB_TESTUSER_PASSWORD=$(tr -dc 'a-zA-Z0-9' < /dev/urandom | fold -w 32 | head -n 1)
    echo "PB_TESTUSER_PASSWORD=${PB_TESTUSER_PASSWORD}" >> ./.env
fi
# Export so the server process (and hooks) inherit them via exec "$@".
export PB_TESTUSER_EMAIL PB_TESTUSER_PASSWORD

if [ -n "${DEV}" ]; then
  # Run the dev server in the background
  bun run dev &
fi

if [ $# -eq 0 ]; then
  # No command provided, default to pocketbase serve
  set -- ./pocketbase serve --dev --automigrate=false --http=0.0.0.0:8090 --publicDir=./dist/client
fi

exec "$@"
