// ℹ️ package responsible to make the connection with mongodb
// https://www.npmjs.com/package/mongoose
const mongoose = require("mongoose");
const uri = process.env.MONGODB_URI;

mongoose.connection.on("error", (err) => {
  console.error(err);
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
    await mongoose.connection.db.admin().command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } catch (err) {
    // Ensures that the client will close when you finish/error
    console.log(err)
  }
}

mongooseClient()
