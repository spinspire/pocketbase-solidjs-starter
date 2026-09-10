// Bootstrap a regular test user from env vars. Defaults mirror entrypoint.sh
// (TESTUSER falls back to SUPERUSER creds) so this also works when the
// server is started directly without the entrypoint. Idempotent: skips when
// the email already exists.
onBootstrap((e) => {
  e.next();
  const email = $os.getenv("PB_TESTUSER_EMAIL") || $os.getenv("PB_SUPERUSER_EMAIL");
  const password = $os.getenv("PB_TESTUSER_PASSWORD") || $os.getenv("PB_SUPERUSER_PASSWORD");
  if (!email || !password) return;
  const existing = e.app.findRecordsByFilter("users", "email = {:email}", "", 1, 0, { email });
  if (existing.length > 0) return;
  try {
    const collection = e.app.findCollectionByNameOrId("users");
    e.app.save(new Record(collection, { email, password, passwordConfirm: password }));
    console.log(`[bootstrap] test user created: ${email}`);
  } catch (err) {
    console.log("[bootstrap] test user failed:", err);
  }
});
