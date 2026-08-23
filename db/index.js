// ℹ️ package responsible to make the connection with mongodb
// https://www.npmjs.com/package/mongoose
const mongoose = require("mongoose");

const uri = process.env.MONGODB_URI;

// Requests wait on the connection promise (see app.js) rather than racing it,
// so buffering is a safety net for a connection dropped mid-flight, not the
// normal path. It has to outlast a cold-start handshake or it fires first and
// masks the real error.
mongoose.set("bufferTimeoutMS", 20000);

mongoose.connection.on("error", (err) => {
  console.error("MongoDB connection error:", err.message);
});

mongoose.connection.on("connected", () => console.log("connected to DB"));

mongoose.connection.on("disconnected", () =>
  console.warn("Lost connection to MongoDB - requests will fail until it returns"),
);

const clientOptions = {
  // A serverless instance is frozen the moment it responds, so any handshake
  // still in flight is suspended and resumes against a clock that kept running.
  // 15s absorbs a cold DNS/TLS/auth round trip plus that lost time.
  serverSelectionTimeoutMS: 15000,
  serverApi: { version: "1", strict: true, deprecationErrors: true },
  dbName: "fair-share",
};

// Module scope survives across warm invocations, so the promise is created once
// and every later request reuses the open connection. A failed attempt clears
// the cache instead of poisoning the instance, letting the next request retry.
let connectionPromise = null;

const openConnection = async () => {
  if (!uri) {
    throw new Error(
      "MONGODB_URI is not set. Add it to .env.local (see .env.example).",
    );
  }

  await mongoose.connect(uri, clientOptions);
  console.log("Connected to MongoDB");
  return mongoose.connection;
};

const connectToDb = () => {
  // 1 === connected. Already-open connections skip the promise entirely.
  if (mongoose.connection.readyState === 1) {
    return Promise.resolve(mongoose.connection);
  }

  if (!connectionPromise) {
    connectionPromise = openConnection().catch((err) => {
      connectionPromise = null;
      throw err;
    });
  }

  return connectionPromise;
};

module.exports = connectToDb;
