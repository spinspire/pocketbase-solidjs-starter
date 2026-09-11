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
