// Rename posts.cover to posts.images and allow multiple files.
// The field id is unchanged so existing files are preserved.
// Convention: images[0] is the cover.
migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId("posts");
    const field = collection.fields.getByName("cover");
    field.name = "images";
    field.maxSelect = 100;
    app.save(collection);

    // Single-file values are stored as a plain filename string while
    // multi-file values are JSON arrays. Wrap plain strings so existing
    // covers become single-element arrays under the new multi-file field.
    const records = app.findRecordsByFilter("posts", "images != ''", "", 1000, 0);
    records.forEach((record) => {
      const value = record.get("images");
      if (typeof value === "string" && value !== "") {
        record.set("images", [value]);
        app.save(record);
      }
    });
  },
  (app) => {
    // Unwrap back to a plain filename (first image, or empty) before
    // renaming back to the single-file cover field.
    const records = app.findRecordsByFilter("posts", "images != ''", "", 1000, 0);
    records.forEach((record) => {
      const value = record.get("images");
      if (Array.isArray(value)) {
        record.set("images", value.length > 0 ? value[0] : "");
        app.save(record);
      }
    });

    const collection = app.findCollectionByNameOrId("posts");
    const field = collection.fields.getByName("images");
    field.name = "cover";
    field.maxSelect = 1;
    app.save(collection);
  },
);
