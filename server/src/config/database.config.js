import { MongoClient } from "mongodb";

let cachedClient = null;
let cachedPromise = null;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || process.env.MONGODB_URL || "";

  if (!uri) {
    throw new Error(
      "MongoDB connection string is not set. Add MONGODB_URI or MONGODB_URL to your server .env file.",
    );
  }

  if (cachedClient) {
    return cachedClient;
  }

  if (!cachedPromise) {
    cachedPromise = MongoClient.connect(uri, {
      serverSelectionTimeoutMS: 10000,
      maxPoolSize: 10,
    });
  }

  try {
    const client = await cachedPromise;
    cachedClient = client;
    console.log("MongoDB connected successfully.");
    return client;
  } catch (error) {
    cachedPromise = null;
    throw error;
  }
};

export default connectDB;
