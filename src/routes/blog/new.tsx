import { Title } from "@solidjs/meta";
import { useNavigate } from "@solidjs/router";
import PostEditor from "../../components/PostEditor";
import { currentUser } from "../../lib/pb";
import { paths } from "../../router";

export default function NewPost() {
  const navigate = useNavigate();
  if (!currentUser()) navigate(paths.login(), { replace: true });
  return (
    <main>
      <Title>New post - Solid App</Title>
      <h1>New post</h1>
      <PostEditor onSave={(_id, slug) => navigate(paths.blog(slug)())} />
    </main>
  );
}
