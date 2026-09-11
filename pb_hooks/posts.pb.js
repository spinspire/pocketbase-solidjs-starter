// posts collection hooks: auto-slug from title, author ownership.

onRecordCreateRequest(function (e) {
  if (e.requestInfo().hasSuperuserAuth()) {
    // Superusers may set any author (or none)
  } else {
    var auth = e.requestInfo() ? e.requestInfo().auth : null;
    if (!auth) throw new ForbiddenError("Login required");
    e.record.set("author", auth.id);
  }
  if (!e.record.get("slug")) {
    var title = (e.record.get("title") || "").toString().toLowerCase();
    var slug = title.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    e.record.set("slug", slug || e.record.id);
  }
  e.next();
}, "posts");

onRecordUpdateRequest(function (e) {
  if (!e.requestInfo().hasSuperuserAuth() && e.requestInfo().body && e.requestInfo().body.author !== undefined)
    throw new ForbiddenError("Cannot change author");
  e.next();
}, "posts");
