import { NextRequest, NextResponse } from "next/server";
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

    const user = await User.findOneAndUpdate(
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
      { upsert: true, new: true }
    );

    console.log(`[SYNC] User ${uid} synced:`, {
      email,
      displayName: name || "",
      photoURL: picture || "",
      provider,
    });

    return NextResponse.json({ user });
  } catch (err: any) {
    console.error("[SYNC] Error:", err.message);
    const msg = err.message || "Unauthorized";
    if (msg.includes("Firebase Admin") || msg.includes("not configured")) {
      return NextResponse.json({ message: msg }, { status: 500 });
    }
    return NextResponse.json({ message: msg }, { status: 401 });
  }
}
