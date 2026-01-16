const app = require("./app.js");

// ℹ️ Sets the PORT for our app to have access to it.
const PORT = process.env.PORT;

app.listen(PORT, (req, res) => {
  console.log(`Server listening on port: ${PORT}`);
});
