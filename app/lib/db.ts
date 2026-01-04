import mongoose from "mongoose";

// Fallback to the provided MongoDB connection string if env var is missing.
const FALLBACK_MONGODB =
  "mongodb+srv://gopidinnearunkumar:ARUN1234%40g@arunscluster.7qlje.mongodb.net/crm?retryWrites=true&w=majority&appName=arunscluster";

const MONGODB_URI = process.env.MONGODB_URI || FALLBACK_MONGODB;

let cached = (global as any).mongoose;
if (!cached) cached = (global as any).mongoose = { conn: null, promise: null };

export async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      dbName: "myapp",
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
