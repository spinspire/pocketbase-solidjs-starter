# syntax=docker/dockerfile:1
# Two-stage image (mirrors pocketbase-sveltekit-starter's shape: PocketBase
# serves the prebuilt client). The client builds in a debian-based bun image
# so native deps resolve to glibc prebuilts — no compilers, no minutes-long
# node-gyp on musl. The runtime stays minimal alpine.
ARG PB_VERSION=0.40.3

FROM oven/bun:1 AS client
# --ignore-scripts: better-sqlite3 (via pocketbase-typegen) would otherwise
# compile SQLite from source for minutes. Nothing at build time needs install
# scripts — the Solid compiler binary ships as a plain optional-dependency
# file on glibc, and better-sqlite3 is never loaded by `bun run build`.
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --ignore-scripts
COPY . .
RUN bun run build

FROM alpine:3.21 AS pb
ARG PB_VERSION
ARG PB_VERSION
RUN apk --no-cache add ca-certificates wget unzip tini && \
    arch=$(uname -m | sed 's/x86_64/amd64/;s/aarch64/arm64/') && \
    wget -q -O /tmp/pb.zip "https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_${arch}.zip" && \
    unzip -o -d /usr/local/bin /tmp/pb.zip pocketbase && \
    chmod +x /usr/local/bin/pocketbase && \
    rm /tmp/pb.zip && \
    adduser -D -u 1000 app && \
    mkdir -p /app/pb_data /app/dist /app/pb_hooks /app/pb_migrations && \
    chown -R app:app /app && \
    chmod g+w /app

FROM alpine:3.21
RUN apk --no-cache add ca-certificates tini && \
    adduser -D -u 1000 app && \
    mkdir -p /app/pb_data /app/dist /app/pb_hooks /app/pb_migrations && \
    chown -R app:app /app && \
    chmod g+w /app
WORKDIR /app
COPY --from=pb /usr/local/bin/pocketbase ./pocketbase
COPY --chown=app:app --from=client /app/dist ./dist
COPY --chown=app:app entrypoint.sh ./
COPY --chown=app:app pb_hooks ./pb_hooks
COPY --chown=app:app pb_migrations ./pb_migrations
# Binary lives next to its data/hooks/migrations — PocketBase resolves those
# paths relative to the executable, not the working directory.
ENV PB_BIN=/app/pocketbase
USER app
ENTRYPOINT ["tini", "--", "./entrypoint.sh"]
