/// <reference path="../pb_data/types.d.ts" />

// Custom API routes (ported from pocketbase-sveltekit-starter, minus sendmail).
// NOTE (Goja): regular functions only — no arrow functions, no shared helpers
// across files. routerAdd signature is (method, pattern, handler, ...middlewares).

/**
 * Demo route. Says hello to the user's name or email. Requires auth.
 */
routerAdd(
  "GET",
  "/api/hello",
  function (c) {
    var auth = c.auth;
    var name = auth ? auth.getString("name") || auth.email() : "stranger";
    return c.json(200, { message: "Hello " + name });
  },
  $apis.requireAuth(),
);

/**
 * Public site config. Reads config.json from the hooks dir and overlays
 * the app name from PocketBase settings. No auth.
 */
routerAdd("GET", "/api/config", function (c) {
  var bytes = $os.readFile(__hooks + "/config.json");
  var str = "";
  for (var i = 0; i < bytes.length; i++) {
    str += String.fromCharCode(bytes[i]);
  }
  var config = JSON.parse(str);
  var settings = $app.settings();
  config.site.name = settings.meta.appName;
  config.site.copyright = settings.meta.appName;
  return c.json(200, config);
});
