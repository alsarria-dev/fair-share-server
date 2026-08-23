// ℹ️ Gets access to environment variables/settings
// https://www.npmjs.com/package/dotenv
require("dotenv").config({ path: [".env.local", ".env"] });

// ℹ️ Connects to the database
const connectToDb = require("./db");

// Require necessary (isAuthenticated) middleware in order to control access to specific routes
const { isAuthenticated } = require("./middleware/jwt.middleware.js");

// Handles http requests (express is node js framework)
// https://www.npmjs.com/package/express
const express = require("express");
const app = express();

// ℹ️ This function is getting exported from the config folder. It runs most pieces of middleware
require("./config")(app);

// 👇 Start handling routes here
app.get("/", (req, res, next) => {
  res.status(418).json({ message: "Nothing to see here, for the moment" });
});

// Every route below this point queries the database. Awaiting the connection
// here means a cold start finishes its handshake before we answer, instead of
// replying early and letting the platform freeze the half-open connection.
// Preflight carries no body to query, so it skips the wait.
app.use((req, res, next) => {
  if (req.method === "OPTIONS") return next();
  connectToDb().then(() => next(), next);
});

const authRoutes = require("./routes/auth.routes");
app.use("/auth", authRoutes);

const groupRoutes = require("./routes/group.routes");
app.use("/groups", isAuthenticated, groupRoutes);

const expenseRoutes = require("./routes/expense.routes");
app.use("/expenses", isAuthenticated, expenseRoutes);

const userRoutes = require("./routes/user.routes");
app.use("/user", isAuthenticated, userRoutes);

// ❗ To handle errors. Routes that don't exist or errors that you handle in specific routes
require("./errors")(app);

module.exports = app;
