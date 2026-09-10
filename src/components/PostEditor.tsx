import { createSignal, Show } from "solid-js";
import type { RecordModel } from "pocketbase";
import { pb } from "../lib/pb";

export type PostDraft = { title: string; excerpt: string; body: string; status: "draft" | "published"; cover?: File };

export default function PostEditor(props: { initial?: RecordModel; onSave: (id: string, slug: string) => void }) {
  const [title, setTitle] = createSignal(props.initial?.title ?? "");
  const [excerpt, setExcerpt] = createSignal(props.initial?.excerpt ?? "");
  const [body, setBody] = createSignal(props.initial?.body ?? "");
  const [status, setStatus] = createSignal<"draft" | "published">(props.initial?.status ?? "draft");
  const [cover, setCover] = createSignal<File | undefined>(undefined);
  const [error, setError] = createSignal<string | null>(null);

  // PocketBase wraps failures in ClientResponseError: top message + per-field detail.
  const errText = (err: unknown): string => {
    if (!(err instanceof Error)) return "Save failed";
    const fields = (err as { data?: { data?: Record<string, { message?: string }> } }).data?.data;
    const first = fields ? Object.entries(fields)[0] : undefined;
    return first?.[1]?.message ? `${err.message} (${first[0]}: ${first[1].message})` : err.message;
  };

  const submit = async (ev: Event) => {
    ev.preventDefault();
    setError(null);
    try {
      const data: Record<string, unknown> = { title: title(), excerpt: excerpt(), body: body(), status: status() };
      if (cover()) data.cover = cover();
      // Mutations must never autocancel: a second save would abort the first.
      const saved = props.initial
        ? await pb.collection("posts").update(props.initial.id, data, { $autoCancel: false })
        : await pb.collection("posts").create(data, { $autoCancel: false });
      props.onSave(saved.id, saved.slug as string);
    } catch (err) {
      setError(errText(err));
    }
  };

  return (
    <form onSubmit={submit}>
      <Show when={error()}><div role="alert">{error()}</div></Show>
      <label data-field>Title<input required value={title()} onInput={(e) => setTitle(e.currentTarget.value)} /></label>
      <label data-field>Excerpt<textarea rows={2} value={excerpt()} onInput={(e) => setExcerpt(e.currentTarget.value)} /></label>
      <label data-field>Body<textarea rows={10} required value={body()} onInput={(e) => setBody(e.currentTarget.value)} /></label>
      <label data-field>Status
        <select value={status()} onChange={(e) => setStatus(e.currentTarget.value as "draft" | "published")}>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
      </label>
      <label data-field>Cover<input type="file" accept="image/*" onChange={(e) => setCover(e.currentTarget.files?.[0])} /></label>
      <footer class="hstack justify-end"><button type="submit">Save</button></footer>
    </form>
  );
}
