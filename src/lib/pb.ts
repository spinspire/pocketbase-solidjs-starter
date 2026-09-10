import PocketBase, { type AuthRecord } from "pocketbase";
import { createSignal } from "solid-js";

export const pb = new PocketBase();

// Testable core: bind a signal to any authStore-shaped client.
// immediate=true replays the current (token, record) into the callback,
// so no separate initial read is needed.
export function createAuthSignal(client: {
  authStore: {
    record: AuthRecord | null;
    onChange: (cb: (token: string, record: AuthRecord | null) => void, immediate?: boolean) => () => void;
  };
}) {
  const [user, setUser] = createSignal<AuthRecord | null>(null);
  client.authStore.onChange((_token, record) => setUser(() => record), true);
  return user;
}

export const currentUser = createAuthSignal(pb);

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
