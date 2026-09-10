import { describe, expect, test } from "vitest";
import { flush } from "solid-js";
import { createAuthStore } from "./pb";

function fakeClient(initial: unknown) {
  const listeners = new Set<(t: string, v: unknown) => void>();
  const store = {
    record: initial,
    onChange(cb: (t: string, v: unknown) => void, immediate?: boolean) {
      listeners.add(cb);
      if (immediate) cb("", store.record);
      return () => listeners.delete(cb);
    },
    emit(t: string, v: unknown) { listeners.forEach((cb) => cb(t, v)); },
  };
  return { authStore: store };
}

describe("createAuthStore", () => {
  test("replays initial record via immediate fire", () => {
    const auth = createAuthStore(fakeClient({ id: "u0" }) as never);
    flush();
    expect(auth.record).toEqual({ id: "u0" });
  });

  test("reflects updates on change", () => {
    const client = fakeClient(null);
    const auth = createAuthStore(client as never);
    expect(auth.record).toBeNull();
    client.authStore.emit("tok", { id: "u1" });
    flush(); // Solid 2.0 batches writes; flush applies synchronously
    expect(auth.record).toEqual({ id: "u1" });
    client.authStore.emit("", null);
    flush();
    expect(auth.record).toBeNull();
  });
});
