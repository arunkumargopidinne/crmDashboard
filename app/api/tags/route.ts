import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/app/lib/db";
import { requireAuth } from "@/app/lib/requireAuth";
import { Tag } from "@/app/models/Tag";
import { User } from "@/app/models/User";

/**
 * GET /api/tags
 * Get all tags for the current user
 */
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const decoded = await requireAuth(req);

    // Map Firebase decoded token to MongoDB user _id
    const mongoUser =
      (await User.findOne({ firebaseUid: decoded.uid })) ||
      (decoded.email ? await User.findOne({ email: decoded.email }) : null);

    if (!mongoUser) {
      throw new Error("User not found in database");
    }

    const userId = mongoUser._id.toString();

    const tags = await Tag.find({ createdBy: userId })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(tags);
  } catch (error: any) {
    console.error("[TAGS] GET Error:", error.message);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

/**
 * POST /api/tags
 * Create a new tag
 */
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const decoded = await requireAuth(req);

    // Map Firebase decoded token to MongoDB user _id
    const mongoUser =
      (await User.findOne({ firebaseUid: decoded.uid })) ||
      (decoded.email ? await User.findOne({ email: decoded.email }) : null);

    if (!mongoUser) {
      throw new Error("User not found in database");
    }

    const userId = mongoUser._id.toString();
    const { name, color } = await req.json();

    if (!name || !name.trim()) {
      return NextResponse.json(
        { message: "Tag name is required" },
        { status: 400 }
      );
    }

    // Check for duplicate tag name
    const existing = await Tag.findOne({
      name: name.trim(),
      createdBy: userId,
    });

    if (existing) {
      return NextResponse.json(
        { message: "Tag with this name already exists" },
        { status: 409 }
      );
    }

    const tag = new Tag({
      name: name.trim(),
      color: color || "#3B82F6",
      createdBy: userId,
    });

    await tag.save();

    return NextResponse.json(tag, { status: 201 });
  } catch (error: any) {
    console.error("[TAGS] POST Error:", error.message);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
