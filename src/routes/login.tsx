import { Title } from "@solidjs/meta";
import { useNavigate } from "@solidjs/router";
import { createSignal, Show } from "solid-js";
import { currentUser, pb } from "../lib/pb";
import { paths } from "../router";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = createSignal("");
  const [password, setPassword] = createSignal("");
  const [collection, setCollection] = createSignal<"users" | "_superusers">("users");
  const [error, setError] = createSignal<string | null>(null);
  if (currentUser()) navigate(paths.blog(), { replace: true });

  const submit = async (ev: Event) => {
    ev.preventDefault();
    setError(null);
    try {
      await pb.collection(collection()).authWithPassword(email(), password(), { $autoCancel: false });
      navigate(paths.blog(), { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    }
  };

  return (
    <main>
      <Title>Login - Solid App</Title>
      <h1>Login</h1>
      <Show when={error()}>
        <div role="alert">{error()}</div>
      </Show>
      <form onSubmit={submit}>
        <label data-field>
          Login as
          <select value={collection()} onChange={(e) => setCollection(e.currentTarget.value as "users" | "_superusers")}>
            <option value="users">User</option>
            <option value="_superusers">Superuser</option>
          </select>
        </label>
        <label data-field>
          Email
          <input type="email" required value={email()} onInput={(e) => setEmail(e.currentTarget.value)} />
        </label>
        <label data-field>
          Password
          <input type="password" required value={password()} onInput={(e) => setPassword(e.currentTarget.value)} />
        </label>
        <footer class="hstack justify-end">
          <button type="submit">Log in</button>
        </footer>
      </form>
    </main>
  );
}
