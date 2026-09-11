/// <reference path="../pb_data/types.d.ts" />

onRecordCreateRequest(function (e) {
  e.next();
  var record = e.record;
  var auth = e.auth;
  var env = ($os.getenv("AUDITLOG") || "").split(",").filter(function (s) { return s.length > 0; });
  if (!record) return;
  var col = record.collection().name;
  if (col === "auditlog" || env.indexOf(col) === -1) return;

  var user = auth && !auth.isSuperuser() ? auth : null;
  var admin = auth && auth.isSuperuser() ? auth : null;
  console.log("AuditLog", col, record.id, "insert", user ? user.id : null, admin ? admin.id : null);

  var ac = $app.findCollectionByNameOrId("auditlog");
  var a = new Record(ac);
  a.set("collection", col);
  a.set("record", record.id);
  a.set("event", "insert");
  a.set("user", user ? user.id : "");
  a.set("admin", admin ? admin.id : "");
  var orig = record.original().publicExport();
  var cur = record.publicExport();
  var keys = Object.keys(orig);
  for (var i = 0; i < keys.length; i++) { if (orig[keys[i]] == cur[keys[i]]) delete orig[keys[i]]; }
  a.set("data", cur);
  a.set("original", orig);
  $app.save(a);
});

onRecordUpdateRequest(function (e) {
  e.next();
  var record = e.record;
  var auth = e.auth;
  var env = ($os.getenv("AUDITLOG") || "").split(",").filter(function (s) { return s.length > 0; });
  if (!record) return;
  var col = record.collection().name;
  if (col === "auditlog" || env.indexOf(col) === -1) return;

  var user = auth && !auth.isSuperuser() ? auth : null;
  var admin = auth && auth.isSuperuser() ? auth : null;
  console.log("AuditLog", col, record.id, "update", user ? user.id : null, admin ? admin.id : null);

  var ac = $app.findCollectionByNameOrId("auditlog");
  var a = new Record(ac);
  a.set("collection", col);
  a.set("record", record.id);
  a.set("event", "update");
  a.set("user", user ? user.id : "");
  a.set("admin", admin ? admin.id : "");
  var orig = record.original().publicExport();
  var cur = record.publicExport();
  var keys = Object.keys(orig);
  for (var i = 0; i < keys.length; i++) { if (orig[keys[i]] == cur[keys[i]]) delete orig[keys[i]]; }
  a.set("data", cur);
  a.set("original", orig);
  $app.save(a);
});

onRecordDeleteRequest(function (e) {
  e.next();
  var record = e.record;
  var auth = e.auth;
  var env = ($os.getenv("AUDITLOG") || "").split(",").filter(function (s) { return s.length > 0; });
  if (!record) return;
  var col = record.collection().name;
  if (col === "auditlog" || env.indexOf(col) === -1) return;

  var user = auth && !auth.isSuperuser() ? auth : null;
  var admin = auth && auth.isSuperuser() ? auth : null;
  console.log("AuditLog", col, record.id, "delete", user ? user.id : null, admin ? admin.id : null);

  var ac = $app.findCollectionByNameOrId("auditlog");
  var a = new Record(ac);
  a.set("collection", col);
  a.set("record", record.id);
  a.set("event", "delete");
  a.set("user", user ? user.id : "");
  a.set("admin", admin ? admin.id : "");
  var orig = record.original().publicExport();
  var cur = record.publicExport();
  var keys = Object.keys(orig);
  for (var i = 0; i < keys.length; i++) { if (orig[keys[i]] == cur[keys[i]]) delete orig[keys[i]]; }
  a.set("data", cur);
  a.set("original", orig);
  $app.save(a);
});
