/**
 * JWT verification middleware, applied per-router in app.js to every gated
 * resource (`/groups`, `/expenses`, `/user`) — `/auth` is intentionally left
 * ungated since signup/login must be reachable without a token.
 *
 * Key exports: `{ isAuthenticated }`.
 */
const { expressjwt: jwt } = require("express-jwt");

/**
 * The configured express-jwt middleware. On success, decodes the token and
 * attaches its payload to `req.payload` — NOT `req.user` (the express-jwt
 * default) — so route handlers must read `req.payload._id`, etc. On failure
 * (missing/malformed/expired token) it throws an `UnauthorizedError`, which
 * errors/index.js maps to a `401` response.
 */
const isAuthenticated = jwt({
  secret: process.env.JWT_SECRET,
  algorithms: ["HS256"],
  requestProperty: "payload",
  getToken: getTokenFromHeaders,
});

/**
 * Extracts the raw JWT from a `Authorization: Bearer <token>` header.
 *
 * @param {import("express").Request} req - the incoming request
 * @returns {string|null} the token string, or `null` if the header is absent
 *   or not in the `Bearer <token>` form (express-jwt then reports it as
 *   "No authorization token was found")
 */
function getTokenFromHeaders(req) {
  // Check if the token is available on the request Headers
  if (
    req.headers.authorization &&
    req.headers.authorization.split(" ")[0] === "Bearer"
  ) {
    // Get the encoded token string and return it
    const token = req.headers.authorization.split(" ")[1];
    return token;
  }

  return null;
}

// Export the middleware so that we can use it to create protected routes
module.exports = {
  isAuthenticated,
};
