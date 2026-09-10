# Agent Guide

This is a SolidJS 2.x project. Solid is not React: components run once (there is no re-render), reactivity is fine-grained through signals, and effects/memos have Solid-specific semantics. Do not port React patterns.

## Versioned skills (in node_modules — read on demand)

The installed packages ship agent skills that match their exact installed versions:

- `node_modules/solid-js/skills/reactivity-diagnostics/SKILL.md` — repair guide mapping every dev-mode diagnostic code (e.g. `REACTIVE_WRITE_IN_OWNED_SCOPE`, `STRICT_READ_UNTRACKED`) to its prescribed fix. Read it whenever a Solid diagnostic code appears in test output or the browser console.
- `node_modules/@solidjs/diagnostics/skills/agent-loops/SKILL.md` — how to capture reactive evidence (which scopes re-ran and why, wasted recomputes, cost tables) and assert budgets, in tests and against live pages.

## Reactive diagnostics — capture evidence instead of guessing

Use these whenever you are debugging reactivity (something doesn't update, updates too often, or is slow) or verifying a change didn't regress update granularity:

- **In tests:** `captureArtifact()` from `@solidjs/diagnostics` wraps a scenario and returns a serializable artifact of diagnostics + rerun attribution; matchers from `@solidjs/diagnostics/vitest` (`toHaveNoDiagnostics`, `toStayWithinRerunBudget`, `toHaveNoWaste`, …) assert on it. No browser needed.
- **Against the running dev server** (`diagnostics: true` in vite.config.ts; dev-only, no-op in builds). Requires an open page connected to the dev server (e.g. via a browser tool):
  - `GET /__solid/diagnostics` — status and connected client count
  - `POST /__solid/diagnostics` with JSON `{"method":"begin"}` then `{"method":"end"}` — capture a session into an artifact
  - `{"method":"whyDidRun","params":{"name":"<scope name>"}}` — recorded re-runs of one named scope in the open session
  - `{"method":"costs"}` — running cost tables for the open session

Name your signals/memos/effects (the `{ name: "..." }` option) — attribution reports scopes by name.

## Backend (PocketBase v0.40, SQLite)

- `entrypoint.sh` is PB-only: downloads the binary, defaults env, runs `migrate up`, `exec`s serve. Never add background processes to it (orphan risk).
- `bun run dev` boots the whole stack: the `pocketbaseDev` plugin in `vite.config.ts` spawns `./entrypoint.sh` (dev-only, `apply: "serve"`) and group-kills it on close/signals.
- `pb_data/` is gitignored scratch; `pb_migrations/` is committed; `pb_hooks/*.pb.js` holds request hooks + `bootstrap.pb.js` (idempotent superuser/test-user/seeds from `PB_*` env).
- Goja gotcha: no top-level functions in hooks — each handler is an isolated scope. Global `onServe` does not exist; use `onBootstrap`.
- The human runs all servers (vite + PB). Never start, stop, or kill server processes.

## Env

`.env` is gitignored; `.env.example` documents `PB_SUPERUSER_*` / `PB_TESTUSER_*` (test user defaults to superuser creds). Never print secret values.
