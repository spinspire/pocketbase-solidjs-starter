import { createMemo, createSignal, For, Show, untrack } from "solid-js";
import { isSuperuser, pb } from "../lib/pb";
import type { PostsResponse, UsersResponse } from "../lib/pocketbase-types";
import { bumpData } from "../lib/refresh";
import { alerts } from "../lib/alerts";

export type PostDraft = { title: string; excerpt: string; body: string; status: "draft" | "published"; cover?: File };

export default function PostEditor(props: { initial?: PostsResponse; onSave: (id: string, slug: string) => void }) {
  const initial = untrack(() => props.initial);
  const [title, setTitle] = createSignal(initial?.title ?? "");
  const [excerpt, setExcerpt] = createSignal(initial?.excerpt ?? "");
  const [body, setBody] = createSignal(initial?.body ?? "");
  const [status, setStatus] = createSignal<"draft" | "published">(initial?.status ?? "draft");
  const [cover, setCover] = createSignal<File | undefined>(undefined);
  const [coverPreview, setCoverPreview] = createSignal<string | null>(initial?.cover ? pb.files.getURL(initial, initial.cover) : null);
  const [authorId, setAuthorId] = createSignal<string>(initial?.author ?? "");
  const [error, setError] = createSignal<string | null>(null);
  const [saving, setSaving] = createSignal(false);

  const authors = createMemo(async () => {
    if (!isSuperuser()) return [];
    return (await pb.collection("users").getFullList({ sort: "email", requestKey: "users-for-author-pick" })) as UsersResponse[];
  });

  const errText = (err: unknown): string => {
    if (!(err instanceof Error)) return "Save failed";
    const status = (err as { status?: number })?.status;
    if (status === 401 || status === 403)
      return "Not authorized. Your session may have expired — log out and log in again.";
    const fields = (err as { data?: { data?: Record<string, { message?: string }> } }).data?.data;
    const first = fields ? Object.entries(fields)[0] : undefined;
    return first?.[1]?.message ? `${err.message} (${first[0]}: ${first[1].message})` : err.message;
  };

  const handlePaste = async (e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const file = item.getAsFile();
        if (!file) return;
        setCover(file);
        setCoverPreview(URL.createObjectURL(file));
        alerts.success("Image pasted as cover.");
        return;
      }
    }
  };

  const removeCover = () => {
    setCover(undefined);
    setCoverPreview(null);
  };

  const submit = async (ev: Event) => {
    ev.preventDefault();
    setError(null);
    if (!pb.authStore.isValid) {
      setError("Session expired. Please log out and log in again.");
      return;
    }
    if (!title().trim()) { setError("Title is required."); return; }
    if (!body().trim()) { setError("Body is required."); return; }
    setSaving(true);
    try {
      const data: Record<string, unknown> = { title: title(), excerpt: excerpt(), body: body(), status: status() };
      if (cover()) data.cover = cover();
      if (isSuperuser() && authorId()) data.author = authorId();
      const saved = props.initial
        ? await pb.collection("posts").update<PostsResponse>(props.initial.id, data, { $autoCancel: false })
        : await pb.collection("posts").create<PostsResponse>(data, { $autoCancel: false });
      bumpData();
      props.onSave(saved.id, saved.slug);
    } catch (err) {
      setError(errText(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <article class="card form-card">
      <form onSubmit={submit}>
        <Show when={error()}><div role="alert">{error()}</div></Show>
      <label data-field>Title<input required value={title()} onInput={(e) => setTitle(e.currentTarget.value)} /></label>
      <label data-field>Excerpt<textarea rows={2} value={excerpt()} onInput={(e) => setExcerpt(e.currentTarget.value)} /></label>
      <label data-field>Body<textarea rows={10} required value={body()} onInput={(e) => setBody(e.currentTarget.value)} onPaste={handlePaste} /></label>
      <label data-field>Status
        <select value={status()} onChange={(e) => setStatus(e.currentTarget.value as "draft" | "published")}>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
      </label>
      <label data-field>Cover
        <Show
          when={coverPreview()}
          fallback={<input type="file" accept="image/*" onChange={(e) => { const f = e.currentTarget.files?.[0]; if (f) { setCover(f); setCoverPreview(URL.createObjectURL(f)); } }} />}
        >
          <div class="cover-preview">
            <img src={coverPreview()!} alt="Cover preview" />
            <button type="button" class="outline" onClick={removeCover}>Remove</button>
          </div>
        </Show>
      </label>
      <Show when={isSuperuser()}>
        <label data-field>Author
          <select value={authorId()} onChange={(e) => setAuthorId(e.currentTarget.value)}>
            <option value="">— none —</option>
            <For each={authors()}>{(a) => <option value={a.id}>{a.email}</option>}</For>
          </select>
        </label>
      </Show>
      <footer class="hstack justify-end"><button type="submit" aria-busy={saving() ? "true" : "false"}>{saving() ? "Saving…" : "Save"}</button></footer>
      </form>
    </article>
  );
}
