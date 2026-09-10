import { Title } from "@solidjs/meta";
import { useNavigate } from "@solidjs/router";
import { createSignal, Show } from "solid-js";
import { pb } from "../lib/pb";
import Guard from "../components/Guard";
import { paths } from "../router";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = createSignal("");
  const [password, setPassword] = createSignal("");
  const [collection, setCollection] = createSignal<"users" | "_superusers">("users");
  const [error, setError] = createSignal<string | null>(null);

  // Redirect-away for authed visits lives in the submit handler below.
  // Guard bounces logged-in visits to the blog.
  const submit = async (ev: Event) => {
    ev.preventDefault();
    setError(null);
    try {
      // Redirect happens via the Guard destination effect above.
      await pb.collection(collection()).authWithPassword(email(), password(), { $autoCancel: false });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    }
  };

  return (
    <Guard destination={paths.blog()}>
    <main>
      <Title>Login - Solid App</Title>
      <h1>Login</h1>
      <article class="card form-card">
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
      </article>
    </main>
    </Guard>
  );
}
