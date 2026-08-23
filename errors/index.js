module.exports = (app) => {
  app.use((req, res, next) => {
    // this middleware runs whenever requested page is not available
    res.status(404).json({ message: "This route does not exist" });
  });

  app.use((err, req, res, next) => {
    // whenever you call next(err), this middleware will handle the error
    // always logs the error
    console.error("ERROR", req.method, req.path, err);

    // only render if the error ocurred before sending the response
    if (!res.headersSent) {
      // express-jwt throws this when a token is missing, malformed, or expired
      if (err.name === "UnauthorizedError") {
        res.status(err.status || 401).json({ message: err.message });
        return;
      }

      // The database is unreachable, so the request never ran. This is a
      // transient infrastructure fault, not a bug in the request - reporting it
      // as 503 keeps it distinguishable from a genuine server error.
      const isDbUnavailable =
        err.name === "MongooseServerSelectionError" ||
        err.name === "MongoNetworkError" ||
        err.name === "MongoNotConnectedError" ||
        /buffering timed out/i.test(err.message || "");

      if (isDbUnavailable) {
        res.status(503).json({
          message:
            "Database unavailable. Please try again in a moment.",
        });
        return;
      }

      // A unique index rejected the write (e.g. an email already registered).
      // Mongoose surfaces this as a driver error, not a ValidationError.
      if (err.code === 11000) {
        const field = Object.keys(err.keyPattern || {})[0];
        res.status(409).json({
          message: field
            ? `That ${field} is already in use.`
            : "That value is already in use.",
        });
        return;
      }

      // Mongoose throws these for malformed ids / failed schema validation -
      // both are client mistakes, not server failures
      const isClientError =
        err.name === "CastError" || err.name === "ValidationError";

      res.status(isClientError ? 400 : 500).json({
        message: isClientError
          ? err.message
          : "Internal server error. Check the server console",
      });
    }
  });
};
