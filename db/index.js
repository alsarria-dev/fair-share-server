const mongoose = require("mongoose");
const uri = process.env.MONGODB_URI;

mongoose.connection.on("error", (err) => {
  logError(err);
});

mongoose.connection.on("connected", () => console.log("connected to DB"));

const clientOptions = {
  serverSelectionTimeoutMS: 5000,
  serverApi: { version: "1", strict: true, deprecationErrors: true },
  dbName: "fair-share",
};

const mongooseClient = async () => {
  try {
    // Create a Mongoose client with a MongoClientOptions object to set the Stable API version
    await mongoose.connect(uri, clientOptions);
    await mongoose.connection.db.command({ ping: 1 });
  } catch (error) {
    console.error(error);
  }
};

module.exports = mongooseClient();
