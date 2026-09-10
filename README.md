# PocketBase SolidJS Starter

A starter template demonstrating how to use [PocketBase](https://pocketbase.io/) with [SolidJS 2](https://v2.solidjs.com/). Includes a blog as a worked example — auth, CRUD, realtime, file uploads, role-based access, pagination — but the goal is the pattern, not the blog itself.

**Stack**: SolidJS 2.0 (fine-grained reactivity, no re-renders) · PocketBase (SQLite, auth, file storage, JS hooks) · oat-css (semantic styling, slate theme) · Solid Router file routes · PocketBase JS SDK · vitest · Playwright e2e.

## Setup

```bash
bun install
cp .env.example .env   # fill in emails; passwords generate on first run
```

| Var | Default |
|---|---|
| `PB_SUPERUSER_EMAIL` / `PB_SUPERUSER_PASSWORD` | required (password generated if missing) |
| `PB_TESTUSER_EMAIL` / `PB_TESTUSER_PASSWORD` | fall back to superuser creds |

## Run

```bash
bun run dev       # vite (:5173) + pocketbase (:8090), one command
bun run build     # static client to dist/client
bun run test      # vitest unit tests
bun run test:e2e  # playwright e2e (needs dev server running)
```

First boot creates the superuser, a test user, and 25 demo posts (all idempotent). Sign in at `/login` as User or Superuser; authors manage their own posts, superusers everything.

## How it works

- **Frontend** (`src/`): file routes in `src/routes` (`/blog`, `/blog/:slug`, editor, login, users). `src/lib/pb.ts` holds the PB singleton + auth signal. State is signals/stores; async flows through memos under `<Loading>` boundaries.
- **Keeping data fresh**: after a mutation, recompute with `refresh(source)` when the memo is in scope; across components, list/detail memos subscribe to a shared revision signal (`src/lib/refresh.ts`) that every mutation bumps via `bumpData()`.
- **Backend**: `entrypoint.sh` downloads PB, applies migrations (`pb_migrations/`, committed), and serves. `pb_hooks/` holds request hooks (auto-slug, author ownership, bootstrap/seeding). `pb_data/` is local scratch.
- **Styling**: semantic HTML + oat-css tokens in `src/App.scss`; no utility classes, no hard-coded colors.
- **Deploy**: Docker — `docker compose build && docker compose up -d`. See `DEPLOYMENT.md` for production hardening (reverse proxy, Litestream backups, SMTP, security).
