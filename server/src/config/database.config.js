import { MongoClient } from "mongodb";

let cachedClient = null;
let cachedPromise = null;

const wait = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

const isTransientConnectionError = (error) =>
  ["EAI_AGAIN", "ESERVFAIL", "ENOTFOUND", "ECONNRESET", "ETIMEDOUT"].includes(
    error?.code,
  ) || ["EAI_AGAIN", "ESERVFAIL", "ENOTFOUND"].includes(error?.cause?.code);

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

  for (let attempt = 1; attempt <= 3; attempt += 1) {
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
      if (attempt === 3 || !isTransientConnectionError(error)) {
        throw error;
      }
      console.warn(`MongoDB connection attempt ${attempt} failed; retrying...`);
      await wait(attempt * 1000);
    }
  }
};

export default connectDB;
