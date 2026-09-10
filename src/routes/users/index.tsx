import { Title } from "@solidjs/meta";
import { useNavigate } from "@solidjs/router";
import { createEffect, createMemo, createSignal, For, Show } from "solid-js";
import type { RecordModel } from "pocketbase";
import { currentUser, pb } from "../../lib/pb";
import { bumpData, dataRev } from "../../lib/refresh";
import { paths } from "../../router";

export default function UsersIndex() {
  const navigate = useNavigate();
  const [email, setEmail] = createSignal("");
  const [password, setPassword] = createSignal("");
  const [name, setName] = createSignal("");
  const [error, setError] = createSignal<string | null>(null);
  const [confirmDelete, setConfirmDelete] = createSignal<string | null>(null);

  // Anon → login; regular users → own profile. Superusers stay.
  createEffect(currentUser, (user) => {
    if (!user) navigate(paths.login(), { replace: true });
    else if (user.collectionName !== "_superusers") navigate(paths.users(user.id), { replace: true });
  });

  const isSuperuser = createMemo(() => currentUser()?.collectionName === "_superusers");
  const users = createMemo(async () => {
    if (!isSuperuser()) return [];
    dataRev();
    return (await pb.collection("users").getFullList({
      sort: "email",
      requestKey: "users-list",
    })) as RecordModel[];
  });

  const create = async (ev: Event) => {
    ev.preventDefault();
    setError(null);
    try {
      await pb.collection("users").create(
        { email: email(), password: password(), passwordConfirm: password(), name: name() },
        { $autoCancel: false },
      );
      setEmail("");
      setPassword("");
      setName("");
      bumpData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
    }
  };

  const remove = async (id: string) => {
    if (confirmDelete() !== id) {
      setConfirmDelete(id);
      return;
    }
    setConfirmDelete(null);
    setError(null);
    try {
      await pb.collection("users").delete(id, { $autoCancel: false });
      bumpData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  };

  const logout = () => {
    pb.authStore.clear();
    navigate(paths.blog(), { replace: true });
  };

  return (
    <main>
      <Title>Users - Solid App</Title>
      <div class="hstack justify-between items-center">
        <h1>Users</h1>
        <menu class="buttons">
          <li>
            <button type="button" class="outline small" onClick={logout}>
              Logout
            </button>
          </li>
        </menu>
      </div>
      <Show when={isSuperuser()}>
        <Show when={error()}>
          <div role="alert">{error()}</div>
        </Show>
        <details>
          <summary>New user</summary>
          <article class="card form-card">
            <form onSubmit={create}>
              <label data-field>
                Email
                <input type="email" required value={email()} onInput={(e) => setEmail(e.currentTarget.value)} />
              </label>
              <label data-field>
                Password
                <input type="password" required value={password()} onInput={(e) => setPassword(e.currentTarget.value)} />
              </label>
              <label data-field>
                Name
                <input value={name()} onInput={(e) => setName(e.currentTarget.value)} />
              </label>
              <footer class="hstack justify-end">
                <button type="submit">Create</button>
              </footer>
            </form>
          </article>
        </details>
        <div class="table">
          <table>
            <thead>
              <tr><th>Email</th><th>Name</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              <For each={users()}>
                {(u) => (
                  <tr>
                    <td><a href={paths.users(u.id)}>{u.email}</a></td>
                    <td>{u.name}</td>
                    <td>
                      <span class="badge" data-variant={u.verified ? "success" : "warning"}>
                        {u.verified ? "Verified" : "Unverified"}
                      </span>
                    </td>
                    <td>
                      <menu class="buttons">
                        <li><a class="button ghost small" href={paths.users(u.id)}>Edit</a></li>
                        <li>
                          <button
                            class="ghost small"
                            data-variant="danger"
                            type="button"
                            onClick={() => void remove(u.id)}
                          >
                            {confirmDelete() === u.id ? "Confirm?" : "Delete"}
                          </button>
                        </li>
                      </menu>
                    </td>
                  </tr>
                )}
              </For>
            </tbody>
          </table>
        </div>
      </Show>
    </main>
  );
}
