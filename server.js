/**
 * Local/traditional-host entry point.
 *
 * Not used on Vercel: there, `app.js`'s exported `app` is invoked directly per
 * request by the `@vercel/node` runtime (see vercel.json), and the DB-readiness
 * gate registered in app.js handles connecting instead of this file's
 * connect-then-listen sequence.
 *
 * Key exports: none — this is a script, not a module other files require.
 */
const app = require("./app.js");
const connectToDb = require("./db");

// ℹ️ Sets the PORT for our app to have access to it.
const PORT = process.env.PORT;

// Locally there is nothing to fall back on, so refuse to start on a database we
// cannot reach rather than serving a port that fails every request. On Vercel
// this file is not the entry point; requests wait on the connection instead.
connectToDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server listening on port: ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Could not connect to MongoDB:", err.message);
    console.error(
      "Check that the Atlas cluster is running (free-tier clusters auto-pause) " +
        "and that this machine's IP is on the cluster's Network Access list.",
    );
    process.exit(1);
  });
