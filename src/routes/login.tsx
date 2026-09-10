import { Title } from "@solidjs/meta";
import { useNavigate } from "@solidjs/router";
import { createSignal, Show } from "solid-js";
import { pb } from "../lib/pb";
import { alerts } from "../lib/alerts";
import Guard from "../components/Guard";
import { paths } from "../router";

export default function Login() {
  const navigate = useNavigate();
  const [mode, setMode] = createSignal<"signin" | "signup">("signin");
  const [email, setEmail] = createSignal("");
  const [password, setPassword] = createSignal("");
  const [passwordConfirm, setPasswordConfirm] = createSignal("");
  const [name, setName] = createSignal("");
  const [collection, setCollection] = createSignal<"users" | "_superusers">("users");
  const [error, setError] = createSignal<string | null>(null);
  const [loading, setLoading] = createSignal(false);

  const submit = async (ev: Event) => {
    ev.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode() === "signup") {
        await pb.collection("users").create({
          email: email(),
          password: password(),
          passwordConfirm: passwordConfirm(),
          name: name(),
        });
        await pb.collection("users").authWithPassword(email(), password(), { $autoCancel: false });
        alerts.success("Account created! Welcome.");
        navigate(paths.blog());
      } else {
        await pb.collection(collection()).authWithPassword(email(), password(), { $autoCancel: false });
        navigate(paths.blog());
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Guard destination={paths.blog()}>
    <main>
      <Title>Login - Solid App</Title>
      <h1>{mode() === "signup" ? "Sign up" : "Log in"}</h1>
      <article class="card form-card">
        <nav class="hstack gap-2" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={mode() === "signin" || undefined}
            class={mode() === "signin" ? "" : "ghost"}
            onClick={() => setMode("signin")}
          >
            Sign in
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode() === "signup" || undefined}
            class={mode() === "signup" ? "" : "ghost"}
            onClick={() => setMode("signup")}
          >
            Sign up
          </button>
        </nav>
        <Show when={error()}>
          <div role="alert">{error()}</div>
        </Show>
        <form onSubmit={submit}>
          <Show when={mode() === "signin"}>
            <label data-field>
              Login as
              <select value={collection()} onChange={(e) => setCollection(e.currentTarget.value as "users" | "_superusers")}>
                <option value="users">User</option>
                <option value="_superusers">Superuser</option>
              </select>
            </label>
          </Show>
          <label data-field>
            Email
            <input type="email" required value={email()} onInput={(e) => setEmail(e.currentTarget.value)} />
          </label>
          <label data-field>
            Password
            <input type="password" required value={password()} onInput={(e) => setPassword(e.currentTarget.value)} />
          </label>
          <Show when={mode() === "signup"}>
            <label data-field>
              Confirm password
              <input type="password" required value={passwordConfirm()} onInput={(e) => setPasswordConfirm(e.currentTarget.value)} />
            </label>
            <label data-field>
              Name
              <input value={name()} onInput={(e) => setName(e.currentTarget.value)} />
            </label>
          </Show>
          <footer class="hstack justify-end">
            <button type="submit" aria-busy={loading() || undefined}>
              {loading() ? "Working…" : mode() === "signup" ? "Sign up" : "Log in"}
            </button>
          </footer>
        </form>
      </article>
    </main>
    </Guard>
  );
}
