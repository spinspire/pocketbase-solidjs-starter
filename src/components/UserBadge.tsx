import { Show } from "solid-js";
import { currentUser, pb } from "../lib/pb";

export default function UserBadge() {
  let dialog!: HTMLDialogElement;

  const logout = () => {
    pb.authStore.clear();
    dialog.close();
  };

  return (
    <Show when={currentUser()}>
      {(user) => (
        <>
          <button
            class="ghost icon"
            type="button"
            aria-label={`Profile for ${user().email}`}
            onClick={() => dialog.showModal()}
          >
            <figure data-variant="avatar" aria-hidden="true">
              <abbr title={user().email}>{user().email.slice(0, 2).toUpperCase()}</abbr>
            </figure>
          </button>
          <dialog ref={dialog} closedby="any">
            <header>
              <h3>{user().email}</h3>
              <p>{user().collectionName === "_superusers" ? "Superuser" : "Author"}</p>
            </header>
            <div>
              <dl>
                <div class="hstack justify-between">
                  <dt class="text-light">User ID</dt>
                  <dd><code>{user().id}</code></dd>
                </div>
                <div class="hstack justify-between">
                  <dt class="text-light">Verified</dt>
                  <dd>{user().verified ? "Yes" : "No"}</dd>
                </div>
              </dl>
            </div>
            <footer>
              <button type="button" class="outline" onClick={() => dialog.close()}>
                Close
              </button>
              <button type="button" data-variant="secondary" onClick={logout}>
                Logout
              </button>
            </footer>
          </dialog>
        </>
      )}
    </Show>
  );
}
