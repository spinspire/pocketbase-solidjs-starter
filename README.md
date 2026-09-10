# Solid 2.0 + PocketBase Starter

A blog app built on [SolidJS 2.0](https://v2.solidjs.com/) (fine-grained reactivity, no re-renders) with [PocketBase](https://pocketbase.io/) (SQLite backend, auth, file storage) and [oat-css](https://oat.ink/) (semantic styling, slate theme). Solid Router file routes, PB JS SDK, vitest suite included.

## Setup

```bash
bun install
cp .env.example .env   # fill in emails; passwords generate on first run
```

| Var | Default |
|---|---|
| `PB_SUPERUSER_EMAIL` / `PB_SUPERUSER_PASSWORD` | required (password generated if missing) |
| `PB_TESTUSER_EMAIL` / `PB_TESTUSER_PASSWORD` | fall back to superuser creds |
| `DEV` | `true` for local dev |

## Run

```bash
bun run dev    # vite (:5173) + pocketbase (:8090), one command
bun run test   # vitest
bun run build  # static client to dist/client
```

First boot creates the superuser, a test user, and 25 demo posts (all idempotent). Sign in at `/login` as User or Superuser; authors manage their own posts, superusers everything.

## How it works

- **Frontend** (`src/`): file routes in `src/routes` (`/blog`, `/blog/:slug`, editor, login). `src/lib/pb.ts` holds the PB singleton + auth signal. State is signals/stores; async flows through memos under `<Loading>` boundaries.
- **Backend**: `entrypoint.sh` downloads PB, applies migrations (`pb_migrations/`, committed), and serves. `pb_hooks/` holds request hooks (auto-slug, author ownership) and `bootstrap.pb.js` (seeding). `pb_data/` is local scratch.
- **Styling**: semantic HTML + oat-css tokens in `src/App.scss`; no utility classes, no hard-coded colors.
- **Prod**: serve `dist/client` statically and run pocketbase with `--publicDir=./dist/client` (see `entrypoint.sh`).
