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

## Notes

- `entrypoint.sh`, `pb_hooks/`, and `pb_migrations/` are baked into the
  image — rebuild after changing any of them.
- PocketBase v0.40 gives `--hooksDir`/`--migrationsDir` no default, so the
  entrypoint passes them explicitly (`./pb_hooks`, `./pb_migrations`).
  The binary lives at `/app/pocketbase` next to them.
- The client builds inside Docker (debian `bun` stage, `--ignore-scripts`
  so `better-sqlite3` never compiles from source); the runtime is minimal
  alpine (~40MB).
