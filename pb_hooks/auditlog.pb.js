/// <reference path="../pb_data/types.d.ts" />

// Audit logging: records field-level diffs for collections listed in the
// AUDITLOG env var (comma-separated). Hooks into all record lifecycle events
// globally but skips the auditlog collection itself to prevent recursion.

onRecordCreateRequest((e) => {
  e.next();
  doAudit("insert", e);
});

onRecordUpdateRequest((e) => {
  e.next();
  doAudit("update", e);
});

onRecordDeleteRequest((e) => {
  e.next();
  doAudit("delete", e);
});

/**
 * @param {string} event
 * @param {core.RecordRequestEvent} request
 * @returns {void}
 */
function doAudit(event, request) {
  const record = request.record;
  const auth = request.auth;
  const collections = ($os.getenv("AUDITLOG") || "").split(",").filter(Boolean);
  if (!record) return;

  const collection = record.collection().name;
  if (collection === "auditlog" || !collections.includes(collection)) return;

  const user = auth && !auth.isSuperuser() ? auth : null;
  const admin = auth && auth.isSuperuser() ? auth : null;

  console.log("AuditLog", collection, record.id, event, user?.id, admin?.id);

  const auditCollection = $app.findCollectionByNameOrId("auditlog");
  const audit = new Record(auditCollection);
  audit.set("collection", collection);
  audit.set("record", record.id);
  audit.set("event", event);
  audit.set("user", user?.id);
  audit.set("admin", admin?.id);

  // Field-level diff: store full current data, original with unchanged keys stripped.
  const original = record.original().publicExport();
  const current = record.publicExport();
  for (const [k, v] of Object.entries(original)) {
    if (v == current[k]) delete original[k];
  }

  audit.set("data", current);
  audit.set("original", original);
  $app.save(audit);
}
