import { useNavigate } from "@solidjs/router";
import { Show, createEffect, type ParentProps } from "solid-js";
import { currentUser, isSuperuser } from "../lib/pb";
import { paths } from "../router";

type GuardProps = ParentProps<{
  /** true = superusers only; undefined = any logged-in user. */
  admin?: boolean;
  /** When set, logged-in visits bounce there instead (e.g. the login page). */
  destination?: string;
}>;

// One gate for auth pages, replacing the per-page createEffect bounce:
// require mode redirects anons to /login and only renders when authorized;
// destination mode always renders and redirects authed visits away.
export default function Guard(props: GuardProps) {
  const navigate = useNavigate();
  const authed = () => !!currentUser();
  const authorized = () => authed() && (props.admin === undefined || isSuperuser() === props.admin);
  createEffect(authed, (loggedIn) => {
    if (props.destination) {
      if (loggedIn) navigate(props.destination);
    } else if (!loggedIn) {
      navigate(paths.login(), { replace: true });
    }
  });
  return <Show when={props.destination ? true : authorized()}>{props.children}</Show>;
}
