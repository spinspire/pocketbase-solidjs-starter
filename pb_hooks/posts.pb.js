// posts collection hooks: auto-slug from title, enforce author ownership.
// Collection rules (in migration): public reads only status='published';
// authors read own drafts; create requires auth; update/delete require author.

// Auto-slug: derive from title when client omits slug.
onRecordCreateRequest((e) => {
  const auth = e.requestInfo()?.auth;
  if (!auth) throw new ForbiddenError("Login required");
  // Author is always the authenticated user — never trust client input.
  e.record.set("author", auth.id);
  if (!e.record.get("slug")) {
    const title = (e.record.get("title") || "").toString().toLowerCase();
    const slug = title.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    e.record.set("slug", slug || e.record.id);
  }
  e.next();
}, "posts");

// Prevent author reassignment on update (rule already restricts to author).
onRecordUpdateRequest((e) => {
  if (!e.requestInfo().hasSuperuserAuth() && e.requestInfo().body?.author !== undefined)
    throw new ForbiddenError("Cannot change author");
  e.next();
}, "posts");
