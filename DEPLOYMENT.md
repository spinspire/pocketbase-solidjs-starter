# Deployment (Docker Compose)

Single container: PocketBase serves the prebuilt Solid client (`--publicDir`).

## Prerequisites

- Docker + Compose plugin
- A `.env` file (compose reads it; see `.env.example`):

```sh
cp .env.example .env
# set PB_SUPERUSER_EMAIL / PB_SUPERUSER_PASSWORD (required)
```

| Variable               | Required | Notes                                             |
| ---------------------- | -------- | ------------------------------------------------- |
| `PB_SUPERUSER_EMAIL`   | yes      | Created on first boot                             |
| `PB_SUPERUSER_PASSWORD`| yes      | Generated + saved to `.env` if email set alone    |
| `PB_TESTUSER_EMAIL`    | no       | Defaults to superuser email; owns the demo posts  |
| `PB_TESTUSER_PASSWORD` | no       | Defaults to superuser password                    |
| `PB_PORT`              | no       | Inside the container (default `8090`)             |

## Run

```sh
docker compose build
docker compose up -d
docker compose logs -f app   # expect "[bootstrap] seeded 25 demo posts"
```

- App: `http://localhost:8090/` · API: `.../api/` · Dashboard: `.../_/`
- Data persists in the `pbdata` volume (`/app/pb_data`).

## Update

```sh
git pull
docker compose build
docker compose up -d
```

Migrations apply automatically on boot (`migrate up`, `--automigrate=false`
on serve). Seeding is idempotent — demo posts are created only when the
`posts` table is empty.

## Fresh start

```sh
docker compose down -v   # deletes the pbdata volume
docker compose up --build
```

## Production hardening

### Reverse proxy (Cloudflare Tunnel or Caddy)

PocketBase runs plain HTTP inside the container. Put it behind a TLS
terminator — Cloudflare Tunnel is zero-config:

```sh
cloudflared tunnel create <name>
# DNS: <tunnel>.cfargotunnel.com → http://localhost:8090
```

If you use a VPS with Caddy, add to `Caddyfile`:

```
yourdomain.com {
  reverse_proxy localhost:8090
}
```

### Trusted proxies

PocketBase needs to know the proxy IP range to trust `X-Forwarded-For`.
Pass `--proxy=true` when running behind a trusted reverse proxy. For
Cloudflare, append to `entrypoint.sh`'s default command:

```sh
set -- "${PB_BIN}" serve --dev --proxy=true ...
```

### Litestream (continuous SQLite backup)

Litestream replicates `pb_data/data.db` to S3/R2 every few seconds.

Add to `docker-compose.yml`:

```yaml
  litestream:
    image: litestream/litestream
    depends_on:
      app:
        condition: service_healthy
    environment:
      LITESTREAM_ACCESS_KEY_ID: ${AWS_ACCESS_KEY_ID}
      LITESTREAM_SECRET_ACCESS_KEY: ${AWS_SECRET_ACCESS_KEY}
    volumes:
      - pbdata:/data
    command: replicate /data/data.db s3://your-bucket/pb/data.db
```

Restore:

```sh
docker compose run --rm litestream restore /data/data.db
```

### SMTP

PocketBase needs SMTP for password resets and verification emails.
Add to `docker-compose.yml` environment:

```yaml
      SMTP_HOST: smtp.example.com
      SMTP_PORT: 587
      SMTP_USERNAME: user@example.com
      SMTP_PASSWORD: your-password
      SMTP_AUTH_METHOD: STARTTLS
      SMTP.receiverAddress: noreply@example.com
```

### Rate limiting and encryption

| Concern                 | Approach                                                |
| ----------------------- | ------------------------------------------------------- |
| Rate limiting           | Use Cloudflare's WAF or Caddy rate limiting            |
| Encryption at rest      | Use Litestream with encrypted S3 bucket or R2          |
| Superuser access limit  | Restrict `/_/` dashboard to your IP via reverse proxy   |
| Audit logging           | Enable PocketBase audit log collection                 |

### SQLite performance

For production workloads, tune the SQLite journal mode:

```sql
PRAGMA journal_mode=WAL;
PRAGMA busy_timeout=5000;
```

These are set by PocketBase by default, but verify in the admin dashboard.

## Notes

- `entrypoint.sh`, `pb_hooks/`, and `pb_migrations/` are baked into the
  image — rebuild after changing any of them.
- PocketBase v0.40 gives `--hooksDir`/`--migrationsDir` no default, so the
  entrypoint passes them explicitly (`./pb_hooks`, `./pb_migrations`).
  The binary lives at `/app/pocketbase` next to them.
- The client builds inside Docker (debian `bun` stage, `--ignore-scripts`
  so `better-sqlite3` never compiles from source); the runtime is minimal
  alpine (~40MB).
