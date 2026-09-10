import { describe, expect, test } from "vitest";
import { flush } from "solid-js";
import { createAuthSignal } from "./pb";

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

describe("createAuthSignal", () => {
  test("replays initial record via immediate fire", () => {
    const currentUser = createAuthSignal(fakeClient({ id: "u0" }) as never);
    flush();
    expect(currentUser()).toEqual({ id: "u0" });
  });

  test("reflects initial record and updates on change", () => {
    const client = fakeClient(null);
    const currentUser = createAuthSignal(client as never);
    expect(currentUser()).toBeNull();
    client.authStore.emit("tok", { id: "u1" });
    flush(); // Solid 2.0 batches writes; flush applies synchronously
    expect(currentUser()).toEqual({ id: "u1" });
    client.authStore.emit("", null);
    flush();
    expect(currentUser()).toBeNull();
  });
});
