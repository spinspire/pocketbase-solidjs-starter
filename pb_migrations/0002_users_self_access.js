// Let users view and update their own record (default is superuser-only).
// List/create/delete stay superuser-only: the app lists via superuser and
// creates via the management UI; bootstrap seeds via hooks.
migrate(
  (app) => {
    const users = app.findCollectionByNameOrId("users");
    users.viewRule = "id = @request.auth.id";
    users.updateRule = "id = @request.auth.id";
    app.save(users);
  },
  (app) => {
    const users = app.findCollectionByNameOrId("users");
    users.viewRule = null;
    users.updateRule = null;
    app.save(users);
  },
);
