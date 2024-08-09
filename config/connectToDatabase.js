const mongoose = require("mongoose");
mongoose.set("strictQuery", true);

const DBName = "DreamsBase";
const uri = process.env.MONGODB_URI || `mongodb://localhost:27017/${DBName}`;
const options = {
  useUnifiedTopology: true,
};

const connectToDatabase = async () => {
  try {
    await mongoose.connect(uri, options);
    console.log(`Connected to database: ${DBName}`);
  } catch (error) {
    console.error(`Error connecting to the database. \n${error}`);
  }
};

module.exports = { connectToDatabase };
