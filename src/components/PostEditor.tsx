import { createMemo, createSignal, For, Show } from "solid-js";
import type { RecordModel } from "pocketbase";
import { currentUser, pb } from "../lib/pb";

export type PostDraft = { title: string; excerpt: string; body: string; status: "draft" | "published"; cover?: File };

export default function PostEditor(props: { initial?: RecordModel; onSave: (id: string, slug: string) => void }) {
  const [title, setTitle] = createSignal(props.initial?.title ?? "");
  const [excerpt, setExcerpt] = createSignal(props.initial?.excerpt ?? "");
  const [body, setBody] = createSignal(props.initial?.body ?? "");
  const [status, setStatus] = createSignal<"draft" | "published">(props.initial?.status ?? "draft");
  const [cover, setCover] = createSignal<File | undefined>(undefined);
  const [authorId, setAuthorId] = createSignal<string>(props.initial?.author ?? "");
  const [error, setError] = createSignal<string | null>(null);

  // Superusers may attribute the post to any user; regular authors are fixed by the hook.
  const isSuperuser = createMemo(() => currentUser()?.collectionName === "_superusers");
  const authors = createMemo(async () => {
    if (!isSuperuser()) return [];
    return (await pb.collection("users").getFullList({ sort: "email", requestKey: "users-for-author-pick" })) as RecordModel[];
  });

  // PocketBase wraps failures in ClientResponseError: top message + per-field detail.
  const errText = (err: unknown): string => {
    if (!(err instanceof Error)) return "Save failed";
    const status = (err as { status?: number })?.status;
    if (status === 401 || status === 403)
      return "Not authorized. Your session may have expired — log out and log in again.";
    const fields = (err as { data?: { data?: Record<string, { message?: string }> } }).data?.data;
    const first = fields ? Object.entries(fields)[0] : undefined;
    return first?.[1]?.message ? `${err.message} (${first[0]}: ${first[1].message})` : err.message;
  };

  const submit = async (ev: Event) => {
    ev.preventDefault();
    setError(null);
    // The badge renders from the stored record even with an expired token —
    // catch that here instead of surfacing a confusing rule failure.
    if (!pb.authStore.isValid) {
      setError("Session expired. Please log out and log in again.");
      return;
    }
    try {
      const data: Record<string, unknown> = { title: title(), excerpt: excerpt(), body: body(), status: status() };
      if (cover()) data.cover = cover();
      if (isSuperuser() && authorId()) data.author = authorId();
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
    <article class="card form-card">
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
      <Show when={isSuperuser()}>
        <label data-field>Author
          <select value={authorId()} onChange={(e) => setAuthorId(e.currentTarget.value)}>
            <option value="">— none —</option>
            <For each={authors()}>{(a) => <option value={a.id}>{a.email}</option>}</For>
          </select>
        </label>
      </Show>
      <footer class="hstack justify-end"><button type="submit">Save</button></footer>
      </form>
    </article>
  );
}
