# Deployment Guide

Single-origin deploy: one standard PocketBase binary serves the API **and**
the prebuilt Solid client. No custom Go build, no Docker, no Node/Bun at
runtime.

What runs in production:

- `./pocketbase` — stock PocketBase binary (downloaded by `entrypoint.sh`)
- `./dist/client/` — static frontend from `bun run build`, served as `--publicDir`
- `./pb_data/` — SQLite (`data.db`), uploads (`storage/`), backups
- `./pb_hooks/`, `./pb_migrations/` — JS hooks + schema migrations (committed)
- `.env` — secrets and ports (never committed)

In dev, Vite forwards `/api` and `/_` to PocketBase on :8090; in production
there is no Vite — PocketBase serves everything on one port.

---

## 1. Build

```sh
bun install --frozen-lockfile
bun run build          # emits purely static dist/client/
chmod +x entrypoint.sh
./entrypoint.sh        # fetches binary, runs `migrate up`, serves
```

What `entrypoint.sh` does, in order:

1. Downloads the linux amd64/arm64 binary if `./pocketbase` is missing
   (`PB_VERSION`, default `0.40.3`; override with `PB_BIN`).
2. Sources `./.env` if present; generates and persists missing passwords when
   an email is set without one.
3. Runs `migrate up` against `./pb_data` + `./pb_migrations`.
4. Execs `serve --automigrate=false` with `--dir`, `--hooksDir`,
   `--migrationsDir`, `--http=0.0.0.0:${PB_PORT:-8090}`,
   `--publicDir=./dist/client`.

Ship the repo (or a tarball) **plus** `dist/client/` to the VPS. `pb_data/`
starts empty — never copy a dev database with test data to production.

---

## 2. VPS setup (systemd)

Any small Linux box works (1 vCPU, 512 MB–1 GB RAM, 10 GB disk) with `bun`
(build only), `wget`, `unzip`, and Caddy or nginx.

```sh
cd /opt/pb-solid   # a clone of this repo on your VPS
cp .env.example .env
# edit .env — set PB_SUPERUSER_EMAIL + PB_SUPERUSER_PASSWORD (see §4)
bun install --frozen-lockfile
bun run build
./entrypoint.sh    # first boot: downloads binary, migrates, seeds
# Ctrl-C after the "[bootstrap]" log lines, then install the service
```

Systemd unit — runs `./entrypoint.sh` directly, restarts on crash:

```ini
# /etc/systemd/system/pb-solid.service
[Unit]
Description=PocketBase + Solid client
After=network.target

[Service]
Type=simple
User=pbapp
WorkingDirectory=/opt/pb-solid
ExecStart=/opt/pb-solid/entrypoint.sh
Restart=always
RestartSec=5
NoNewPrivileges=true

[Install]
WantedBy=multi-user.target
```

```sh
sudo useradd -r -s /usr/sbin/nologin pbapp || true
sudo chown -R pbapp:pbapp /opt/pb-solid
sudo systemctl daemon-reload && sudo systemctl enable --now pb-solid
```

Updates (migrations apply automatically on restart; seeding is idempotent):

```sh
cd /opt/pb-solid && git pull
bun install --frozen-lockfile && bun run build
sudo systemctl restart pb-solid
```

---

## 3. Reverse proxy + HTTPS

PocketBase listens plain HTTP on `PB_PORT`. Put Caddy or nginx in front.

**Caddy (recommended — automatic HTTPS):**

```
# /etc/caddy/Caddyfile
app.example.com {
  reverse_proxy 127.0.0.1:8090
}
```

**nginx:**

```nginx
server {
  listen 443 ssl;
  server_name app.example.com;

  ssl_certificate     /etc/letsencrypt/live/app.example.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/app.example.com/privkey.pem;

  location / {
    proxy_pass http://127.0.0.1:8090;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

**Cloudflare note:** if the domain is proxied (orange cloud), set SSL/TLS to
**Full (Strict)** so the edge validates your origin certificate.

---

## 4. Env var reference

`.env` is gitignored. Copy `.env.example` and set at least the superuser pair.

| Variable               | Default                    | Notes                                           |
| ---------------------- | -------------------------- | ----------------------------------------------- |
| `PB_SUPERUSER_EMAIL`   | — (required)               | Created at first boot by the bootstrap hook     |
| `PB_SUPERUSER_PASSWORD`| generated → saved to `.env`| Set explicitly; 32+ random chars in production  |
| `PB_TESTUSER_EMAIL`    | `PB_SUPERUSER_EMAIL`       | Optional; owns demo content                     |
| `PB_TESTUSER_PASSWORD` | `PB_SUPERUSER_PASSWORD`    | Optional; generated if email set alone          |
| `PB_PORT`              | `8090`                     | Binds `--http=0.0.0.0:${PB_PORT}`               |
| `PB_VERSION`           | `0.40.3`                   | Binary version `entrypoint.sh` downloads        |
| `PB_BIN`               | `./pocketbase`             | Override to use a system-installed binary       |
| `AUDITLOG`             | — (unset)                  | Collections to audit, e.g. `posts`              |
| `DEV`                  | legacy, ignored            | Kept for compatibility; the vite plugin owns dev|

Back up `.env` separately (password manager) — losing the superuser password
means a CLI reset via `pocketbase superuser`.

---

## 5. Backups (SQLite)

Everything lives in `pb_data/`: `data.db` (+ `-wal`/`-shm` while running),
`storage/` (uploads), `backups/` (dashboard backups).

```sh
# Consistent copy — seconds of downtime
sudo systemctl stop pb-solid
cp pb_data/data.db "/root/backups/pb-$(date +%F).db"
sudo systemctl start pb-solid

# Or hot copy with the SQLite backup API (no downtime)
sqlite3 pb_data/data.db ".backup '/root/backups/pb-$(date +%F).db'"
```

Keep 7 daily + 4 weekly copies with one synced off-box (`rsync`, R2, Borg).
Restore by stopping the service, putting the file back, and starting it.

**Litestream note:** it tails the WAL and streams it to S3/R2 for
point-in-time recovery, but it wraps the server process, which conflicts with
the systemd unit above. Only adopt it for sub-minute RPO, and test a restore
to a scratch path first. Dashboard Backups (local or S3) plus cron covers
most single-server needs.

---

## 6. S3 / R2 file storage

Uploads default to disk in `pb_data/storage/`. For object storage, use any
S3-compatible bucket (R2 has zero egress fees) via Dashboard → Settings →
Files → Storage:

- File URL base: your public file hostname (e.g. the R2 `pub-….r2.dev` URL)
- S3 endpoint: your account's `r2.cloudflarestorage.com` URL (`auto` region)
- S3 access / secret key: from an R2 API token with read/write on the bucket
- S3 bucket: your bucket name

Enable before launch — existing local files do not migrate automatically.
The §5 database backup strategy still applies either way.

---

## 7. Security checklist

- [ ] Strong unique `PB_SUPERUSER_PASSWORD` (32+ random chars); `.env` is `chmod 600` and **not** in git.
- [ ] Admin dashboard (`/_/`) IP-restricted at the proxy, or gated with Cloudflare Access / basic auth.
- [ ] PocketBase rate limits enabled (Dashboard → Settings → Application).
- [ ] Superuser MFA/OTP enabled on the `_superusers` collection.
- [ ] HTTPS only (Caddy/nginx + Cloudflare **Full (Strict)** if proxied).
- [ ] Firewall: allow 80/443 (and SSH), deny direct `8090` from the net.
- [ ] OS auto-updates on; `Restart=always` on the systemd unit.
- [ ] Backups verified — at least one test restore (see §5).

---

## 8. Health check + logs

```sh
# API ping (expect API-connected JSON)
curl -s http://127.0.0.1:8090/api/health

# Admin UI through the proxy (expect 200)
curl -s -o /dev/null -w "%{http_code}\n" https://app.example.com/_/

# Service + live logs
systemctl status pb-solid --no-pager
journalctl -u pb-solid -f
```

If the API is up but the page is blank, `dist/client/` is stale or missing —
re-run `bun run build` and restart the service.
