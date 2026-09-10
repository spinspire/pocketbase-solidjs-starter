// posts collection hooks: auto-slug from title, author ownership.
// Collection rules (in migration): public reads only status='published';
// authors read own drafts; create requires auth; update/delete require author.
// Superusers bypass API rules AND may set/reassign author; regular users get
// author forced to self on create and cannot change it after.

// Auto-slug: derive from title when client omits slug.
onRecordCreateRequest((e) => {
  // Note: requestInfo().auth is null for superusers — check superuser first.
  if (e.requestInfo().hasSuperuserAuth()) {
    // Superusers may set any author (or none) — relation validation applies.
  } else {
    const auth = e.requestInfo()?.auth;
    if (!auth) throw new ForbiddenError("Login required");
    // Regular authors are always the authenticated user — never trust client input.
    e.record.set("author", auth.id);
  }
  if (!e.record.get("slug")) {
    const title = (e.record.get("title") || "").toString().toLowerCase();
    const slug = title.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    e.record.set("slug", slug || e.record.id);
  }
  e.next();
}, "posts");

// Author reassignment: superusers may set any author; regular users cannot
// change it (API rules already restrict their updates to own posts).
onRecordUpdateRequest((e) => {
  if (!e.requestInfo().hasSuperuserAuth() && e.requestInfo().body?.author !== undefined)
    throw new ForbiddenError("Cannot change author");
  e.next();
}, "posts");
