import PocketBase, { type AuthRecord } from "pocketbase";
import { createMemo, createStore } from "solid-js";

export const pb = new PocketBase();

export type AuthState = {
  /** The logged-in record (user or superuser), or null when logged out. */
  record: AuthRecord | null;
};

// Testable core: bind a reactive identity store to any authStore-shaped
// client. immediate=true replays the current (token, record) into the
// callback, so no separate initial read is needed.
export function createAuthStore(client: {
  authStore: {
    record: AuthRecord | null;
    onChange: (cb: (token: string, record: AuthRecord | null) => void, immediate?: boolean) => () => void;
  };
}) {
  const [auth, setAuth] = createStore<AuthState>({ record: null });
  client.authStore.onChange((_token, record) => {
    setAuth((draft) => {
      draft.record = record;
    });
  }, true);
  return auth;
}

export const auth = createAuthStore(pb);

/** Back-compat accessor; prefer `auth.record` / `isSuperuser` in new code. */
export const currentUser = () => auth.record;

// Reactive role check for UI gates (nav, drafts, editors). Reads the store,
// so it updates on login/logout — unlike pb.authStore.isSuperuser, which is
// a plain getter for one-shot checks.
export const isSuperuser = createMemo(() => auth.record?.collectionName === "_superusers");

// Validate the stored session at startup: the badge must never pose as
// logged in on a dead token. Locally-expired tokens clear immediately;
// otherwise confirm with the server and clear only on 401/403 (a network
// failure must not log the user out).
if (typeof window !== "undefined" && pb.authStore.token) {
  if (!pb.authStore.isValid) {
    pb.authStore.clear();
  } else {
    const collection = pb.authStore.record?.collectionName ?? "users";
    pb
      .collection(collection)
      .authRefresh({ $autoCancel: false })
      .catch((err: unknown) => {
        const status = (err as { status?: number })?.status;
        if (status === 401 || status === 403) pb.authStore.clear();
      });
  }
}
