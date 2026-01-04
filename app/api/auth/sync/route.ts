import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "../../../lib/db";
import { requireAuth } from "../../../lib/requireAuth";
import { User } from "../../../models/User";

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const decoded = await requireAuth(req);
    const { uid, email, name, picture, firebase } = decoded;

    if (!email) {
      return NextResponse.json({ message: "Email missing in token" }, { status: 400 });
    }

    // Determine auth provider from sign_in_provider in token
    const provider = firebase?.sign_in_provider === "google.com" ? "google" : "password";

    // Use rawResult to detect whether document was newly created or updated
    // If uid is null/undefined, use email as fallback filter to avoid duplicate key errors
    let result: any = null;
    const filterQuery = uid && uid !== "undefined" ? { firebaseUid: uid } : { email };

    try {
      result = await User.findOneAndUpdate(
        filterQuery,
        {
          $set: {
            firebaseUid: uid || undefined, // Only set if not null
            email,
            displayName: name || "",
            photoURL: picture || "",
            provider,
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true, rawResult: true }
      );
    } catch (err: any) {
      // If we hit a duplicate key error due to firebaseUid index
      if (err.code === 11000 && err.keyPattern?.firebaseUid) {
        console.log("[SYNC] Handling E11000 duplicate key on firebaseUid, dropping and recreating index");
        
        // Drop the old index
        try {
          await User.collection.dropIndex("firebaseUid_1");
        } catch (dropErr) {
          console.log("[SYNC] Index drop result:", dropErr.message);
        }

        // Remove existing null firebaseUid documents
        try {
          const removed = await User.deleteMany({ firebaseUid: null });
          console.log(`[SYNC] Removed ${removed.deletedCount} documents with null firebaseUid`);
        } catch (delErr) {
          console.log("[SYNC] Error removing null documents:", delErr.message);
        }

        // Recreate indexes from schema
        try {
          await User.syncIndexes();
          console.log("[SYNC] Indexes recreated with sparse option");
        } catch (syncErr) {
          console.log("[SYNC] Error syncing indexes:", syncErr.message);
        }

        // Retry the update
        result = await User.findOneAndUpdate(
          filterQuery,
          {
            $set: {
              firebaseUid: uid || undefined,
              email,
              displayName: name || "",
              photoURL: picture || "",
              provider,
            },
          },
          { upsert: true, new: true, setDefaultsOnInsert: true, rawResult: true }
        );
        console.log("[SYNC] Retry successful after index fix");
      } else {
        throw err;
      }
    }

    const user = result.value;
    const updatedExisting = !!result.lastErrorObject?.updatedExisting;
    const action = updatedExisting ? "updated" : "created";

    const readyState = mongoose.connection?.readyState;
    const stateMap: Record<number, string> = {
      0: "disconnected",
      1: "connected",
      2: "connecting",
      3: "disconnecting",
    };

    console.log(`[SYNC] User ${uid} ${action}:`, {
      email,
      displayName: name || "",
      photoURL: picture || "",
      provider,
      dbState: stateMap[readyState] || readyState,
    });

    return NextResponse.json({
      message: `User ${action} in MongoDB`,
      created: !updatedExisting,
      user,
      dbState: stateMap[readyState] || readyState,
    });
  } catch (err: any) {
    console.error("[SYNC] Error:", err);
    const msg = err?.message || "Unauthorized";
    if (msg.includes("Firebase Admin") || msg.includes("not configured")) {
      return NextResponse.json({ message: msg }, { status: 500 });
    }
    // If it's a DB connection error, return 500 so it's obvious in client logs
    if (msg.toLowerCase().includes("mongo") || msg.toLowerCase().includes("connection")) {
      return NextResponse.json({ message: msg }, { status: 500 });
    }
    return NextResponse.json({ message: msg }, { status: 401 });
  }
}
