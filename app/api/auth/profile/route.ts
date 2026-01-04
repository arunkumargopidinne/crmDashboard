import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "../../../lib/db";
import { requireAuth } from "../../../lib/requireAuth";
import { User } from "../../../models/User";

export async function PUT(req: NextRequest) {
  try {
    await connectDB();

    const decoded = await requireAuth(req);
    const uid = decoded.uid;

    const body = await req.json();
    const { displayName, photoURL, preferences } = body || {};

    const user = await User.findOneAndUpdate(
      { firebaseUid: uid },
      {
        $set: {
          ...(displayName !== undefined ? { displayName } : {}),
          ...(photoURL !== undefined ? { photoURL } : {}),
          ...(preferences !== undefined ? { preferences } : {}),
        },
      },
      { new: true }
    );

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (err: any) {
    const msg = err.message || "Unauthorized";
    if (msg.includes("Firebase Admin") || msg.includes("not configured")) {
      return NextResponse.json({ message: msg }, { status: 500 });
    }
    return NextResponse.json({ message: msg }, { status: 401 });
  }
}
