// ℹ️ package responsible to make the connection with mongodb
// https://www.npmjs.com/package/mongoose
const mongoose = require("mongoose");

const uri = process.env.MONGODB_URI;

// Queries issued before the connection is up sit in mongoose's buffer. The
// 10s default turns any connectivity problem into a slow, opaque 500, so fail
// fast instead and let the error handler surface it as a 503.
mongoose.set("bufferTimeoutMS", 2000);

mongoose.connection.on("error", (err) => {
  console.error("MongoDB connection error:", err.message);
});

mongoose.connection.on("connected", () => console.log("connected to DB"));

mongoose.connection.on("disconnected", () =>
  console.warn("Lost connection to MongoDB - requests will fail until it returns"),
);

const clientOptions = {
  serverSelectionTimeoutMS: 5000,
  serverApi: { version: "1", strict: true, deprecationErrors: true },
  dbName: "fair-share",
};

// Serving traffic without a database only produces buffering timeouts on every
// request, so a failed connection is fatal rather than something we log past.
// On Vercel each invocation is short-lived and exiting would just crash-loop
// the function, so there we stay up and let requests fail with a clear 503.
const abort = () => {
  if (process.env.VERCEL) return;
  process.exit(1);
};

const connectToDb = async () => {
  if (!uri) {
    console.error(
      "MONGODB_URI is not set. Add it to .env.local (see .env.example).",
    );
    return abort();
  }

  try {
    // Create a Mongoose client with a MongoClientOptions object to set the Stable API version
    await mongoose.connect(uri, clientOptions);
    await mongoose.connection.db.admin().command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!",
    );
  } catch (err) {
    console.error("Could not connect to MongoDB:", err.message);
    console.error(
      "Check that the Atlas cluster is running (free-tier clusters auto-pause) " +
        "and that this machine's IP is on the cluster's Network Access list.",
    );
    return abort();
  }
};

module.exports = connectToDb();
