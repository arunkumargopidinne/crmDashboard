import mongoose from "mongoose";

// Fallback to the provided MongoDB connection string if env var is missing.
const FALLBACK_MONGODB =
  "mongodb+srv://gopidinnearunkumar:ARUN1234%40g@arunscluster.7qlje.mongodb.net/crm?retryWrites=true&w=majority&appName=arunscluster";

const MONGODB_URI = process.env.MONGODB_URI || FALLBACK_MONGODB;
const MONGODB_DB = process.env.MONGODB_DB; // optional override for the DB name

let cached = (global as any).mongoose;
if (!cached) cached = (global as any).mongoose = { conn: null, promise: null };

export async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    const opts: any = {};
    // Only set dbName if explicitly provided so the URI's DB is used by default
    if (MONGODB_DB) opts.dbName = MONGODB_DB;

    cached.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then((client) => {
        console.log("[DB] Connected to MongoDB", {
          uriPresent: !!MONGODB_URI,
          dbName: opts.dbName || "from-connection-string",
        });
        return client;
      })
      .catch((err) => {
        console.error("[DB] Connection error:", err);
        throw err;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
