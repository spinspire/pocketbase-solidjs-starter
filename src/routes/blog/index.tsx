import { Title } from "@solidjs/meta";
import { Errored, For, Show, createMemo, createSignal } from "solid-js";
import type { RecordModel } from "pocketbase";
import { currentUser, pb } from "../../lib/pb";
import { paths } from "../../router";

const PER_PAGE = 10;

async function fetchPublished(page: number) {
  return pb.collection("posts").getList(page, PER_PAGE, {
    filter: "status = 'published'",
    sort: "-publishedAt,-created",
    expand: "author",
    requestKey: `posts-list-p${page}`,
  });
}

export default function BlogIndex() {
  const [page, setPage] = createSignal(1);

  // Async memos: no manual signal writes, so no owned-scope violations.
  // Reads suspend under the App <Loading> boundary until settled.
  const result = createMemo(() => fetchPublished(page()));
  const drafts = createMemo(async () => {
    const user = currentUser();
    // Superusers don't author posts; their id never matches the users relation.
    if (!user || user.collectionName === "_superusers") return [];
    return (await pb.collection("posts").getFullList({
      filter: `author = '${user.id}' && status = 'draft'`,
      sort: "-updated",
      requestKey: `posts-drafts-${user.id}`,
    })) as RecordModel[];
  });

  const items = createMemo(() => result()?.items ?? []);

  return (
    <main>
      <Title>Blog - Solid App</Title>
      <h1>Blog</h1>
      <Errored fallback={<div role="alert">Couldn't load posts. Try again later.</div>}>
      <Show when={currentUser()?.collectionName === "users"}>
        <p><a href={paths.blog.new()}>New post</a></p>
        <Show when={drafts().length > 0}>
          <h2>Your drafts</h2>
          <For each={drafts()}>
            {(d) => (
              <article class="card">
                <header class="hstack justify-between">
                  <h3>{d.title}</h3>
                  <span class="badge" data-variant="warning">Draft</span>
                </header>
                <footer><a href={`${paths.blog(d.slug as string)()}/edit`}>Edit</a></footer>
              </article>
            )}
          </For>
        </Show>
      </Show>
      <For each={items()}>
        {(post) => (
          <article class="card">
            <header><h3><a href={paths.blog(post.slug as string)()}>{post.title}</a></h3></header>
            <p class="text-light">{post.excerpt}</p>
          </article>
        )}
      </For>
      </Errored>
      <menu class="buttons">
        <li><button class="outline small" disabled={page() <= 1} onClick={() => setPage(page() - 1)}>← Prev</button></li>
        <li><button class="outline small" disabled={!result() || page() >= result()!.totalPages} onClick={() => setPage(page() + 1)}>Next →</button></li>
      </menu>
    </main>
  );
}
