// 404 catchall for unknown /api/* paths: returns a JSON error instead of
// falling through to the SPA's index.html (which would confuse clients).
routerAdd("GET /api/{path...}", (e) => {
  e.json(404, { code: 404, message: "Not found", data: {} });
});
routerAdd("POST /api/{path...}", (e) => {
  e.json(404, { code: 404, message: "Not found", data: {} });
});
routerAdd("PUT /api/{path...}", (e) => {
  e.json(404, { code: 404, message: "Not found", data: {} });
});
routerAdd("PATCH /api/{path...}", (e) => {
  e.json(404, { code: 404, message: "Not found", data: {} });
});
routerAdd("DELETE /api/{path...}", (e) => {
  e.json(404, { code: 404, message: "Not found", data: {} });
});
routerAdd("OPTIONS /api/{path...}", (e) => {
  e.json(404, { code: 404, message: "Not found", data: {} });
});
