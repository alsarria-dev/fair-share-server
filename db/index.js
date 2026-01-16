const mongoose = require("mongoose");
const MONGO_URI = process.env.MONGODB_URI;

// mongoose.connection.on("error", (err) => {
//   logError(err);
// });

// mongoose.connection.on("connected", () => console.log("connected to DB"));

// const clientOptions = {
//   serverSelectionTimeoutMS: 5000,
//   serverApi: { version: "1", strict: true, deprecationErrors: true },
//   dbName: "fair-share",
// };

// const mongooseClient = async () => {
//   try {
//     // Create a Mongoose client with a MongoClientOptions object to set the Stable API version
//     await mongoose.connect(uri, clientOptions);
//     await mongoose.connection.db.command({ ping: 1 });
//   } catch (error) {
//     console.error(error);
//   }
// };

// module.exports = mongooseClient();

mongoose
  .connect(MONGO_URI, { dbName: "fair-share" })
  .then((x) => {
    console.log(x.connections[0].name);
    const dbName = x.connections[0].name;
    console.log(`Connected to Mongo! Database name: "${dbName}"`);
  })
  .catch((err) => {
    console.error("Error connecting to mongo: ", err);
  });
