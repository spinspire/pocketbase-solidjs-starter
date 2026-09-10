import { Title } from "@solidjs/meta";
import { useNavigate } from "@solidjs/router";
import PostEditor from "../../components/PostEditor";
import Guard from "../../components/Guard";
import { paths } from "../../router";

export default function NewPost() {
  const navigate = useNavigate();
  return (
    <Guard>
      <main>
        <Title>New post - PocketBase SolidJS</Title>
        <h1>New post</h1>
        <PostEditor onSave={(_id, slug) => navigate(paths.blog(slug)())} />
      </main>
    </Guard>
  );
}
