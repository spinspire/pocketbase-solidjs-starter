import { Show } from "solid-js";
import { currentUser } from "../lib/pb";
import { paths } from "../router";

// Avatar link to the profile area: superusers land on user management,
// regular users bounce to their own profile. Logged-out renders nothing
// (the nav shows a Login link instead).
export default function UserBadge() {
  return (
    <Show when={currentUser()}>
      {(user) => (
        <a href={paths.users()} aria-label={`Profile for ${user().email}`} class="button ghost icon">
          <figure data-variant="avatar" aria-hidden="true">
            <abbr title={user().email}>{user().email.slice(0, 2).toUpperCase()}</abbr>
          </figure>
        </a>
      )}
    </Show>
  );
}
