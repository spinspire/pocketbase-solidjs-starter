import { Title } from "@solidjs/meta";
import { useNavigate, type RouteProps } from "@solidjs/router";
import { Errored, Loading, Show, createMemo } from "solid-js";
import PostEditor from "../../../components/PostEditor";
import { currentUser, pb } from "../../../lib/pb";
import { paths } from "../../../router";

export default function EditPost(props: RouteProps<"/blog/:slug/edit">) {
  const navigate = useNavigate();
  if (!currentUser()) navigate(paths.login(), { replace: true });
  const post = createMemo(() =>
    pb.collection("posts").getFirstListItem(`slug = '${props.params.slug}'`, {
      requestKey: `post-edit-${props.params.slug}`,
    }),
  );
  return (
    <Errored fallback={<main><h1>Not found</h1></main>}>
      <Loading fallback={<main aria-busy="true">Loading post…</main>}>
        <main>
          <Title>Edit post - Solid App</Title>
          <h1>Edit post</h1>
          {/* Keyed Show resolves the async value in a suspending scope:
              passing post() directly as a prop reads it in PostEditor's
              untracked body (PENDING_ASYNC_UNTRACKED_READ). */}
          <Show when={post()} keyed>
            {(p) => <PostEditor initial={p} onSave={(_id, slug) => navigate(paths.blog(slug)())} />}
          </Show>
        </main>
      </Loading>
    </Errored>
  );
}
