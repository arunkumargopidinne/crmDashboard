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
    const result = await User.findOneAndUpdate(
      { firebaseUid: uid },
      {
        $set: {
          firebaseUid: uid,
          email,
          displayName: name || "",
          photoURL: picture || "",
          provider,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true, rawResult: true }
    );

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
