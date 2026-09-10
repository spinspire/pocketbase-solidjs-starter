import { Title } from '@solidjs/meta';
import '@knadh/oat/oat.min.js';
import { Loading, Show, For } from 'solid-js';
import { useLocation } from '@solidjs/router';
import { paths, Router } from './router';
import Alerts from './components/Alerts';
import UserBadge from './components/UserBadge';
import { currentUser, isSuperuser } from './lib/pb';
import './App.scss';

const NAV_LINKS = [
  { href: paths(), label: 'Home', end: true },
  { href: paths.blog(), label: 'Blog' },
] as const;

export default function App() {
  const location = useLocation();
  const isActive = (href: string, end?: boolean) =>
    end ? location.pathname === href : location.pathname.startsWith(href);

  return (
    <Router>
      {(props) => (
        <>
          <Title>PocketBase SolidJS Starter</Title>
          <nav>
            <For each={NAV_LINKS}>
              {(link) => (
                <a href={link.href} aria-current={isActive(link.href, 'end' in link && link.end) ? 'page' : undefined}>
                  {link.label}
                </a>
              )}
            </For>
            <Show when={isSuperuser()}>
              <a href={paths.users()} aria-current={isActive(paths.users()) ? 'page' : undefined}>Users</a>
            </Show>
            <Show when={currentUser()} fallback={<a href={paths.login()}>Login</a>}>
              <UserBadge />
            </Show>
          </nav>
          <Loading fallback={<main>Loading…</main>}>{props.children}</Loading>
          <Alerts />
        </>
      )}
    </Router>
  );
}
