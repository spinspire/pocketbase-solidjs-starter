# syntax=docker/dockerfile:1
# PocketBase + prebuilt Solid client. Dev uses `bun run dev` on the host;
# this image is the production shape: entrypoint bootstraps and serves.
ARG PB_VERSION=0.40.3

FROM oven/bun:1-alpine AS client
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build

FROM alpine:3.21 AS pb
ARG PB_VERSION
RUN apk --no-cache add ca-certificates wget unzip tini && \
    arch=$(uname -m | sed 's/x86_64/amd64/;s/aarch64/arm64/') && \
    wget -q -O /tmp/pb.zip "https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_${arch}.zip" && \
    unzip -o -d /usr/local/bin /tmp/pb.zip pocketbase && \
    chmod +x /usr/local/bin/pocketbase && \
    rm /tmp/pb.zip

FROM alpine:3.21
RUN apk --no-cache add ca-certificates tini && \
    adduser -D -u 1000 app && \
    mkdir -p /app/pb_data /app/dist /app/pb_hooks /app/pb_migrations && \
    chown -R app:app /app && \
    chmod g+w /app
COPY --from=pb /usr/local/bin/pocketbase /usr/local/bin/pocketbase
COPY --from=client /app/dist ./dist
COPY --chown=app:app entrypoint.sh pb_hooks/ pb_migrations/
ENV PB_BIN=/usr/local/bin/pocketbase
WORKDIR /app
USER app
ENTRYPOINT ["tini", "--", "./entrypoint.sh"]
