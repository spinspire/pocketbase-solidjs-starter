import { useNavigate } from "@solidjs/router";
import { Show, createEffect, type ParentProps } from "solid-js";
import { currentUser, isSuperuser } from "@/lib/pb";
import { paths } from "@/router";

type GuardProps = ParentProps<{
  /** true = superusers only; undefined = any logged-in user. */
  admin?: boolean;
  /** When set, logged-in visits bounce there instead (e.g. the login page). */
  destination?: string;
  /** Where to redirect logged-in users who lack the required role. Defaults to /users/:id (own profile). */
  unauthorized?: string;
}>;

// One gate for auth pages, replacing the per-page createEffect bounce:
// require mode redirects anons to /login and only renders when authorized;
// destination mode always renders and redirects authed visits away.
export default function Guard(props: GuardProps) {
  const navigate = useNavigate();
  const authed = () => !!currentUser();
  const authorized = () => authed() && (props.admin === undefined || isSuperuser() === props.admin);
  const unauthorizedTarget = () => {
    if (props.unauthorized) return props.unauthorized;
    const u = currentUser();
    return u ? paths.users(u.id) : paths.login();
  };
  createEffect(authed, (loggedIn) => {
    if (props.destination) {
      if (loggedIn) navigate(props.destination);
    } else if (!loggedIn) {
      navigate(paths.login(), { replace: true });
    } else if (!authorized()) {
      navigate(unauthorizedTarget(), { replace: true });
    }
  });
  return <Show when={props.destination ? true : authorized()}>{props.children}</Show>;
}
