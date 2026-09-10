import { createSignal } from "solid-js";

// Global data revision: list/detail memos read dataRev() so any mutation
// can invalidate them with bumpData(). Covers cross-component staleness
// (e.g. editing a post, then viewing its detail page) where refresh()
// can't reach the other component's memo.
const [rev, setRev] = createSignal(0);
export const dataRev = rev;
export const bumpData = () => setRev((r) => r + 1);
