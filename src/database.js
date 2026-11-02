import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error("MONGODB_URI is required. Add your MongoDB connection string to .env.");
}

export const mongoClient = new MongoClient(uri);
export const database = mongoClient.db(
  process.env.MONGODB_DB || process.env.MONGODB_DATABASE || "commonplace",
);
