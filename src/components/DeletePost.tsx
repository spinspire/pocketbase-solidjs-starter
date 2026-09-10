import { useNavigate } from "@solidjs/router";
import { Show, createSignal } from "solid-js";
import { pb } from "../lib/pb";
import { alertOnFailure, alerts } from "../lib/alerts";
import { bumpData } from "../lib/refresh";
import { paths } from "../router";

// Inline two-step delete (mirrors the users table pattern): first click arms
// the confirm, second click deletes, alerts, and returns to the blog list.
export default function DeletePost(props: { id: string; title: string }) {
  const navigate = useNavigate();
  const [confirming, setConfirming] = createSignal(false);
  const remove = () =>
    alertOnFailure(async () => {
      if (!confirming()) {
        setConfirming(true);
        return;
      }
      await pb.collection("posts").delete(props.id, { $autoCancel: false });
      bumpData();
      alerts.success(`Deleted "${props.title}"`, 5000);
      navigate(paths.blog());
    });
  return (
    <Show
      when={confirming()}
      fallback={
        <button type="button" class="outline small" data-variant="danger" onClick={() => void remove()}>
          Delete
        </button>
      }
    >
      <span class="hstack gap-2 items-center">
        <span>Delete this post?</span>
        <button type="button" class="small" data-variant="danger" onClick={() => void remove()}>
          Yes, delete
        </button>
        <button type="button" class="ghost small" onClick={() => setConfirming(false)}>
          Cancel
        </button>
      </span>
    </Show>
  );
}
