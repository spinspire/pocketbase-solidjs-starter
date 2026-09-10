import { Title } from "@solidjs/meta";
import { useNavigate, type RouteProps } from "@solidjs/router";
import { Errored, Loading, Show, createMemo } from "solid-js";
import PostEditor from "@/components/PostEditor";
import Guard from "@/components/Guard";
import { currentUser, isSuperuser, pb } from "@/lib/pb";
import type { PostsResponse } from "@/lib/pocketbase-types";
import { paths } from "@/router";

export default function EditPost(props: RouteProps<"/blog/:slug/edit">) {
  const navigate = useNavigate();
  const post = createMemo(() =>
    pb.collection("posts").getFirstListItem<PostsResponse>(pb.filter("slug = {:slug}", { slug: props.params.slug }), {
      requestKey: `post-edit-${props.params.slug}`,
    }),
  );
  // Superusers edit anything; authors edit their own posts (any status).
  const canEdit = createMemo(() => {
    const p = post();
    const me = currentUser();
    return !!me && (isSuperuser() || p.author === me.id);
  });
  return (
    <Guard>
    <Errored fallback={<main><h1>Not found</h1></main>}>
      <Loading fallback={<main aria-busy="true">Loading post…</main>}>
        <main>
          <Title>Edit post - PocketBase SolidJS</Title>
          <div class="hstack justify-between items-center">
            <h1>Edit post</h1>
            <a href={paths.blog(props.params.slug)()} class="button ghost small">← Back to post</a>
          </div>
          {/* Keyed Show resolves the async value in a suspending scope:
              passing post() directly as a prop reads it in PostEditor's
              untracked body (PENDING_ASYNC_UNTRACKED_READ). */}
          <Show
            when={canEdit()}
            fallback={
              <div role="alert">
                You don't have permission to edit this post. <a href={paths.blog(post().slug)()}>Back to post</a>
              </div>
            }
          >
            <PostEditor initial={post()} onSave={(_id, slug) => navigate(paths.blog(slug)())} />
          </Show>
        </main>
      </Loading>
    </Errored>
    </Guard>
  );
}
