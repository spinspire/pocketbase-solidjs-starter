import { Title } from "@solidjs/meta";
import { Errored, For, Show, createMemo, createSignal } from "solid-js";
import { currentUser, isSuperuser, pb } from "../../lib/pb";
import { renderMarkdown } from "../../lib/markdown";
import { dataRev } from "../../lib/refresh";
import Paginator from "../../components/Paginator";
import { paths } from "../../router";

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
  return pb.collection("posts").getList(page, PER_PAGE, {
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

  return (
    <main>
      <Title>Blog - Solid App</Title>
      <h1>Blog</h1>
      <Errored fallback={<div role="alert">Couldn't load posts. Try again later.</div>}>
      <Show when={currentUser()}>
        <p><a href={paths.blog.new()}>New post</a></p>
      </Show>
      <Paginator page={page()} totalPages={result()?.totalPages ?? 1} onPage={setPage} />
      <div class="post-grid">
        <For each={items()}>
          {(post) => (
            <article class="card post-card">
              <header class="hstack justify-between items-center">
                <h3><a href={paths.blog(post.slug as string)()}>{post.title}</a></h3>
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
                  src={pb.files.getURL(post, post.cover as string, { thumb: "800x450" })}
                  alt=""
                  loading="lazy"
                />
              </Show>
              <div class="text-light" innerHTML={renderMarkdown(post.excerpt)} />
              <footer class="hstack justify-between items-center">
                <small class="text-light">
                  {(post.expand as Record<string, { name?: string; email?: string }> | undefined)?.author?.name ?? "Unknown"}
                </small>
                <span class="hstack gap-2">
                  <Show when={isSuperuser() || post.author === currentUser()?.id}>
                    <a href={`${paths.blog(post.slug as string)()}/edit`} class="button outline small">Edit</a>
                  </Show>
                  <a href={paths.blog(post.slug as string)()} class="button ghost small">Read →</a>
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
