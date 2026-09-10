import { Title } from "@solidjs/meta";
import type { RouteProps } from "@solidjs/router";
import { Errored, Loading, Show, createMemo } from "solid-js";
import { pb } from "../../../lib/pb";
import type { Router } from "../../../router";

export default function PostDetail(props: RouteProps<"/blog/:slug">) {
  const post = createMemo(() =>
    pb.collection("posts").getFirstListItem(pb.filter("slug = {:slug}", { slug: props.params.slug }), {
      expand: "author",
      requestKey: `post-${props.params.slug}`,
    }),
  );
  const coverUrl = createMemo(() => {
    const p = post();
    return p?.cover ? pb.files.getURL(p, p.cover, { thumb: "800x0" }) : null;
  });

  return (
    <Errored fallback={<main><h1>Not found</h1><p>No post with this slug.</p></main>}>
      <Loading fallback={<main aria-busy="true">Loading post…</main>}>
        <main>
          <Title>{`${post().title} - Solid App`}</Title>
          <Show when={post().status === "draft"}>
            <span class="badge" data-variant="warning">Draft</span>
          </Show>
          <h1>{post().title}</h1>
          <p class="text-light">{post().publishedAt ?? post().created} · {(post().expand as Record<string, { name?: string }>)?.author?.name ?? "Unknown"}</p>
          <Show when={coverUrl()}>{(url) => <img src={url()} alt="" />}</Show>
          <p>{post().body}</p>
        </main>
      </Loading>
    </Errored>
  );
}
