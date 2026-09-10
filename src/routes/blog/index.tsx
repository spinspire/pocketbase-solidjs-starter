import { Title } from "@solidjs/meta";
import { Errored, For, Show, createEffect, createMemo, createSignal, onCleanup } from "solid-js";
import { currentUser, isSuperuser, pb } from "../../lib/pb";
import { renderMarkdown } from "../../lib/markdown";
import { dataRev } from "../../lib/refresh";
import Paginator from "../../components/Paginator";
import { paths } from "../../router";
import type { PostsResponse, UsersResponse } from "../../lib/pocketbase-types";
import styles from "./index.module.scss";

const PER_PAGE = 15; // multiple of the 3-column grid

function fmtDate(iso: string | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

async function fetchPosts(page: number, user: { id: string; collectionName: string } | null) {
  dataRev();
  // One list for everyone; visibility IS the filter. Drafts render
  // identically except for their badge.
  const filter = !user
    ? "status = 'published'"
    : user.collectionName === "_superusers"
      ? ""
      : pb.filter("status = 'published' || author = {:author}", { author: user.id });
  return pb.collection("posts").getList<PostsResponse<{ author: UsersResponse }>>(page, PER_PAGE, {
    filter,
    sort: "-created",
    expand: "author",
    requestKey: `posts-list-p${page}`,
  });
}

export default function BlogIndex() {
  const [page, setPage] = createSignal(1);

  // Async memos: no manual signal writes, so no owned-scope violations.
  // Reads suspend under the App <Loading> boundary until settled.
  const result = createMemo(() =>
    fetchPosts(
      page(),
      (() => {
        const u = currentUser();
        return u ? { id: u.id, collectionName: u.collectionName ?? "" } : null;
      })(),
    ),
  );

  const items = createMemo(() => result()?.items ?? []);

  type Post = PostsResponse<{ author: UsersResponse }>;
  const [live, setLive] = createSignal<Post[]>([]);
  // Seed/resync from fetches (effect phase writes are legal).
  createEffect(items, (list) => {
    setLive(list);
  });

  const visible = (p: Post): boolean => {
    if (p.status === "published") return true;
    const me = currentUser();
    return !!me && (isSuperuser() || p.author === me.id);
  };

  // Live-merge realtime events. Server only sends what API rules allow;
  // visible() re-applies the role filter for status flips. Expanded author
  // isn't in realtime payloads, so updates carry over the old expansion.
  const applyRealtime = (e: { action: string; record: Post }) => {
    setLive((list) => {
      if (e.action === "create") {
        if (!visible(e.record)) return list;
        if (list.some((p) => p.id === e.record.id)) return list;
        return [e.record, ...list].slice(0, PER_PAGE);
      }
      if (e.action === "update") {
        if (!visible(e.record)) return list.filter((p) => p.id !== e.record.id);
        return list.map((p) =>
          p.id === e.record.id ? { ...e.record, expand: p.expand } : p,
        );
      }
      if (e.action === "delete") return list.filter((p) => p.id !== e.record.id);
      return list;
    });
  };
  let unsub: (() => void) | undefined;
  void pb
    .collection("posts")
    .subscribe("*", applyRealtime)
    .then((u) => {
      unsub = u;
    });
  onCleanup(() => unsub?.());

  return (
    <main>
      <Title>Blog - PocketBase SolidJS</Title>
      <h1>Blog</h1>
      <Errored fallback={<div role="alert">Couldn't load posts. Try again later.</div>}>
      <Show when={currentUser()}>
        <p><a href={paths.blog.new()}>New post</a></p>
      </Show>
      <Paginator page={page()} totalPages={result()?.totalPages ?? 1} onPage={setPage} />
      <div class={styles.grid}>
        <For each={live()}>
          {(post) => (
            <article class="card">
              <header class="hstack justify-between items-center">
                <h3><a href={paths.blog(post.slug)()}>{post.title}</a></h3>
                <span class="hstack gap-2">
                  <Show when={post.status === "draft"}>
                    <span class="badge" data-variant="warning">Draft</span>
                  </Show>
                  {(() => {
                    const date = fmtDate(post.status === "draft" ? post.updated : (post.publishedAt ?? post.created));
                    return date ? <span class="badge">{date}</span> : null;
                  })()}
                </span>
              </header>
              <Show when={post.cover}>
                <img
                  src={pb.files.getURL(post, post.cover, { thumb: "800x450" })}
                  alt=""
                  loading="lazy"
                />
              </Show>
              <div class="text-light" innerHTML={renderMarkdown(post.excerpt)} />
              <footer class="hstack justify-between items-center">
                <small class="text-light">
                  {post.expand?.author?.name ?? "Unknown"}
                </small>
                <span class="hstack gap-2">
                  <Show when={isSuperuser() || post.author === currentUser()?.id}>
                    <a href={`${paths.blog(post.slug)()}/edit`} class="button outline small">Edit</a>
                  </Show>
                  <a href={paths.blog(post.slug)()} class="button ghost small">Read →</a>
                </span>
              </footer>
            </article>
          )}
        </For>
      </div>
      </Errored>
      <Paginator page={page()} totalPages={result()?.totalPages ?? 1} onPage={setPage} />
    </main>
  );
}
