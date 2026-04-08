import mongoose from "mongoose";
import "dotenv/config";

const MONGO_URL = process.env.MONGO_URL as string;

if (!MONGO_URL) {
  throw new Error("MONGO_URL environment variable is not defined");
}

export async function connectDB() {
  try {
    await mongoose.connect(MONGO_URL);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
}

mongoose.connection.on("disconnected", () => {
  console.warn("MongoDB disconnected, attempting to reconnect...");
});

mongoose.connection.on("error", (err) => {
  console.error("MongoDB connection error:", err);
});
