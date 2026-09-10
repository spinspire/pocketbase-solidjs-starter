import { Title } from "@solidjs/meta";
import { useNavigate, type RouteProps } from "@solidjs/router";
import { Errored, Loading, Show, createEffect, createMemo, createSignal, refresh } from "solid-js";
import { currentUser, pb } from "@/lib/pb";
import Guard from "@/components/Guard";
import { bumpData } from "@/lib/refresh";
import { alerts } from "@/lib/alerts";
import { paths } from "@/router";

export default function UserProfile(props: RouteProps<"/users/:id">) {
  const navigate = useNavigate();
  const [name, setName] = createSignal("");
  const [avatar, setAvatar] = createSignal<File | undefined>(undefined);
  const [avatarPreview, setAvatarPreview] = createSignal<string | null>(null);
  const [oldPassword, setOldPassword] = createSignal("");
  const [newPassword, setNewPassword] = createSignal("");
  const [error, setError] = createSignal<string | null>(null);
  const [saved, setSaved] = createSignal(false);
  const [loaded, setLoaded] = createSignal(false);
  const [savingProfile, setSavingProfile] = createSignal(false);
  const [savingPassword, setSavingPassword] = createSignal(false);

  const user = createMemo(() =>
    pb.collection("users").getOne(props.params.id, { requestKey: `user-${props.params.id}` }),
  );
  // Superusers edit anyone; regular users edit themselves.
  const canEdit = createMemo(() => {
    const me = currentUser();
    const target = user();
    return !!me && !!target && (me.collectionName === "_superusers" || me.id === target.id);
  });
  const avatarUrl = createMemo(() => {
    const u = user();
    return u?.avatar ? pb.files.getURL(u, u.avatar, { thumb: "160x160" }) : null;
  });

  const handleAvatarPaste = (e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const file = item.getAsFile();
        if (!file) return;
        setAvatar(file);
        setAvatarPreview(URL.createObjectURL(file));
        alerts.success("Image pasted as avatar.");
        return;
      }
    }
  };

  const removeAvatar = () => {
    setAvatar(undefined);
    setAvatarPreview(null);
  };

  // Sync the name field once the record resolves (effect phase, not render).
  createEffect(user, (u) => {
    if (u && !loaded()) {
      setName(u.name ?? "");
      setLoaded(true);
    }
  });

  const saveProfile = async (ev: Event) => {
    ev.preventDefault();
    setError(null);
    setSaved(false);
    setSavingProfile(true);
    try {
      const data: Record<string, unknown> = { name: name() };
      if (avatar()) data.avatar = avatar();
      const updated = await pb.collection("users").update(user().id, data, { $autoCancel: false });
      setName(updated.name ?? "");
      setAvatar(undefined);
      setSaved(true);
      refresh(user); // reload page data (avatar, name)
      bumpData(); // management list shows fresh names
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSavingProfile(false);
    }
  };

  const savePassword = async (ev: Event) => {
    ev.preventDefault();
    setError(null);
    setSaved(false);
    setSavingPassword(true);
    try {
      const self = currentUser()?.collectionName !== "_superusers";
      const data: Record<string, unknown> = {
        password: newPassword(),
        passwordConfirm: newPassword(),
      };
      if (self) data.oldPassword = oldPassword();
      await pb.collection("users").update(user().id, data, { $autoCancel: false });
      setOldPassword("");
      setNewPassword("");
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Password change failed");
    } finally {
      setSavingPassword(false);
    }
  };

  const logout = () => {
    pb.authStore.clear();
    navigate(paths.blog(), { replace: true });
  };

  return (
    <Guard>
    <Errored fallback={<main><h1>Not found</h1></main>}>
      <Loading fallback={<main aria-busy="true">Loading profile…</main>}>
        <main>
          <Title>{`User ${user().email} - PocketBase SolidJS`}</Title>
          <div class="hstack justify-between items-center">
            <h1>{user().name || user().email}</h1>
            <menu class="buttons">
              <li>
                <button type="button" class="outline small" onClick={logout}>
                  Logout
                </button>
              </li>
            </menu>
          </div>
          <p class="text-light">{user().email}</p>
          <Show when={avatarPreview()}>
            <div class="cover-preview">
              <img src={avatarPreview()!} alt="Avatar preview" />
              <button type="button" class="outline" onClick={removeAvatar}>Remove</button>
            </div>
          </Show>
          <Show when={!avatarPreview() && avatarUrl()}>{(url) => <img src={url()} alt="" width="80" height="80" />}</Show>
          <Show when={error()}>
            <div role="alert">{error()}</div>
          </Show>
          <Show when={saved()}>
            <div role="alert" data-variant="success">Saved.</div>
          </Show>
          <Show
            when={canEdit()}
            fallback={
              <div role="alert">
                You don't have permission to edit this profile. <a href={paths.blog()}>Back to blog</a>
              </div>
            }
          >
            <article class="card form-card">
              <header><h3>Profile</h3></header>
              <form onSubmit={saveProfile}>
                <label data-field>
                  Name
                  <input value={name()} onInput={(e) => setName(e.currentTarget.value)} />
                </label>
                <label data-field>
                  Avatar
                  <Show
                    when={avatarPreview()}
                    fallback={<input type="file" accept="image/*" onChange={(e) => { const f = e.currentTarget.files?.[0]; if (f) { setAvatar(f); setAvatarPreview(URL.createObjectURL(f)); } }} onPaste={handleAvatarPaste} />}
                  >
                    <div class="cover-preview">
                      <img src={avatarPreview()!} alt="Avatar preview" />
                      <button type="button" class="outline" onClick={removeAvatar}>Remove</button>
                    </div>
                  </Show>
                </label>
                <footer class="hstack justify-end">
                  <button type="submit" aria-busy={savingProfile() ? "true" : "false"}>{savingProfile() ? "Saving…" : "Save profile"}</button>
                </footer>
              </form>
            </article>
            <article class="card form-card">
              <header><h3>Password</h3></header>
              <form onSubmit={savePassword}>
                <Show when={currentUser()?.collectionName !== "_superusers"}>
                  <label data-field>
                    Current password
                    <input
                      type="password"
                      required
                      value={oldPassword()}
                      onInput={(e) => setOldPassword(e.currentTarget.value)}
                    />
                  </label>
                </Show>
                <label data-field>
                  New password
                  <input
                    type="password"
                    required
                    minlength={8}
                    value={newPassword()}
                    onInput={(e) => setNewPassword(e.currentTarget.value)}
                  />
                </label>
                <footer class="hstack justify-end">
                  <button type="submit" aria-busy={savingPassword() ? "true" : "false"}>{savingPassword() ? "Changing…" : "Change password"}</button>
                </footer>
              </form>
            </article>
          </Show>
          <Show when={currentUser()?.collectionName !== "_superusers"}>
            <p class="text-light">
              <small>Manage all users by logging in as a superuser.</small>
            </p>
          </Show>
        </main>
      </Loading>
    </Errored>
    </Guard>
  );
}
