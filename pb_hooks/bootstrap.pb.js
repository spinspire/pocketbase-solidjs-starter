// Bootstrap a regular test user from env vars + seed demo posts.
// Defaults mirror entrypoint.sh (TESTUSER falls back to SUPERUSER creds) so
// this also works when the server is started directly without the entrypoint.
//
// NOTE (Goja): no top-level function declarations — each handler runs in an
// isolated scope. All logic lives inside onBootstrap.
onBootstrap((e) => {
  e.next();

  const slugify = (title) => {
    return title
      .toString()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  // --- test user (idempotent) ---
  const email = $os.getenv("PB_TESTUSER_EMAIL") || $os.getenv("PB_SUPERUSER_EMAIL");
  const password = $os.getenv("PB_TESTUSER_PASSWORD") || $os.getenv("PB_SUPERUSER_PASSWORD");
  if (!email || !password) {
    console.log("[bootstrap] PB_TESTUSER_* not set, skipping seed");
    return;
  }
  let user = null;
  const existing = e.app.findRecordsByFilter("users", "email = {:email}", "", 1, 0, { email });
  if (existing.length > 0) {
    user = existing[0];
  } else {
    try {
      const collection = e.app.findCollectionByNameOrId("users");
      const record = new Record(collection);
      record.set("email", email);
      record.set("password", password);
      record.set("passwordConfirm", password);
      e.app.save(record);
      console.log(`[bootstrap] test user created: ${email}`);
      user = record;
    } catch (err) {
      console.log("[bootstrap] test user failed:", err);
      return;
    }
  }

  // --- demo posts (only when empty) ---
  const anyPosts = e.app.findRecordsByFilter("posts", "", "", 1, 0, {});
  if (anyPosts.length > 0) return;
  const adjectives = ["Quick", "Bright", "Calm", "Eager", "Fresh", "Grand", "Happy", "Keen", "Lively", "Neat"];
  const nouns = ["Notes", "Guide", "Update", "Story", "Review", "Primer", "Roundup", "Essay", "Memo", "Journal"];
  const posts = e.app.findCollectionByNameOrId("posts");
  let created = 0;
  for (let i = 0; i < 25; i++) {
    const title = `${adjectives[i % adjectives.length]} ${nouns[Math.floor(i / adjectives.length) % nouns.length]} ${i + 1}`;
    const status = i % 5 === 4 ? "draft" : "published";
    try {
      const record = new Record(posts);
      record.set("title", title);
      record.set("slug", slugify(title));
      record.set("excerpt", `${title} — demo excerpt.`);
      record.set("body", `This is demo body text for "${title}". Replace it with real content.`);
      record.set("status", status);
      if (status === "published") {
        record.set("publishedAt", new Date(Date.now() - i * 86400000).toISOString());
      }
      record.set("author", user.id);
      e.app.save(record);
      created++;
    } catch (err) {
      console.log("[bootstrap] seed post failed:", err);
    }
  }
  console.log(`[bootstrap] seeded ${created} demo posts`);
});
