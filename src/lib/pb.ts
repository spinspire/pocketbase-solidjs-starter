import PocketBase, { type AuthRecord } from "pocketbase";
import { createSignal } from "solid-js";

export const pb = new PocketBase();

// Testable core: bind a signal to any authStore-shaped client.
export function createAuthSignal(client: {
  authStore: {
    record: AuthRecord | null;
    onChange: (cb: (token: string, record: AuthRecord | null) => void) => () => void;
  };
}) {
  const [user, setUser] = createSignal<AuthRecord | null>(client.authStore.record);
  client.authStore.onChange((_token, record) => setUser(() => record));
  return user;
}

export const currentUser = createAuthSignal(pb);
