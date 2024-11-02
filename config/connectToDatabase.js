const mongoose = require("mongoose");
mongoose.set("strictQuery", true);
require("dotenv").config();

const DBName = "DreamsBase";
const uri =
  process.env.MONGODB_URI ||
  `mongodb+srv://dreamsappbmd:URQijjGVsbK07IXV@cluster0.34yig.mongodb.net/${DBName}`;
const options = {
  useUnifiedTopology: true,
};

class Database {
  static instance;

  constructor() {
    if (Database.instance) {
      return Database.instance;
    }
    Database.instance = this;
    this._connection = null;
  }

  async connect() {
    if (!this._connection) {
      try {
        this._connection = await mongoose.connect(uri);
        console.log(`Connected to database: ${DBName}`);
      } catch (error) {
        console.error("Error connecting to database: ", error);
      }
    }
    return this._connection;
  }

  async disconnect() {
    if (this._connection) {
      try {
        await mongoose.disconnect();
        this._connection = null;
        console.log("Disconnected from database");
      } catch (error) {
        console.error("Error disconnecting from database: ", error);
      }
    }
  }

  async getConnection() {
    if (this._connection) {
      return this._connection;
    }
    return this.connect();
  }
}

// Khởi tạo instance duy nhất của Database
const database = new Database();

module.exports = database;
