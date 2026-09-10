import { Title } from "@solidjs/meta";
import type { RouteProps } from "@solidjs/router";
import { Errored, Loading, Show, createMemo } from "solid-js";
import { currentUser, isSuperuser, pb } from "../../../lib/pb";
import type { PostsResponse, UsersResponse } from "../../../lib/pocketbase-types";
import { renderMarkdown } from "../../../lib/markdown";
import { dataRev } from "../../../lib/refresh";
import { paths } from "../../../router";
import type { Router } from "../../../router";

export default function PostDetail(props: RouteProps<"/blog/:slug">) {
  const post = createMemo(() => {
    dataRev();
    return pb.collection("posts").getFirstListItem<PostsResponse<{ author: UsersResponse }>>(pb.filter("slug = {:slug}", { slug: props.params.slug }), {
      expand: "author",
      requestKey: `post-${props.params.slug}`,
    });
  });
  const coverUrl = createMemo(() => {
    const p = post();
    return p?.cover ? pb.files.getURL(p, p.cover, { thumb: "800x0" }) : null;
  });
  // Read-only view. Editing lives only in the /edit route (single editor UI).
  const canEdit = createMemo(() => {
    const me = currentUser();
    const p = post();
    return !!me && (isSuperuser() || p.author === me.id);
  });

  return (
    <Errored fallback={<main><h1>Not found</h1><p>No post with this slug.</p></main>}>
      <Loading fallback={<main aria-busy="true">Loading post…</main>}>
        <main>
          <Title>{`${post().title} - Solid App`}</Title>
          <div class="hstack gap-2 items-center">
            <Show when={post().status === "draft"}>
              <span class="badge" data-variant="warning">Draft</span>
            </Show>
            <Show when={canEdit()}>
              <a href={`${paths.blog(props.params.slug)()}/edit`} class="button outline small">Edit post</a>
            </Show>
          </div>
          <h1>{post().title}</h1>
          <p class="text-light">{post().publishedAt ?? post().created} · {post().expand?.author?.name ?? "Unknown"}</p>
          <Show when={coverUrl()}>{(url) => <img src={url()} alt="" class="post-cover" />}</Show>
          <div class="markdown-body" innerHTML={renderMarkdown(post().body)} />
        </main>
      </Loading>
    </Errored>
  );
}
