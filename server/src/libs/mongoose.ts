import mongoose from "mongoose";
import config from "../config/config";

const MONGODB_URL = config.mongodbUrl;

if (!MONGODB_URL) {
  console.error("❌ MONGODB_URL is not defined in .env file!");
  process.exit(1);
}

const DB_NAME = "Alumzi";

// Cache the connection globally (important for nodemon)
let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = {
    conn: null,
    promise: null
  };
}

const connectToDB = async () => {
  // ✅ Already connected
  if (cached.conn) {
    return cached.conn;
  }

  // ⏳ Connection in progress
  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URL, { dbName: DB_NAME })
      .then((mongoose) => {
        console.log("✅ MongoDB connected");
        return mongoose;
      })
      .catch((err) => {
        cached.promise = null;
        throw err;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
};

export default connectToDB;
