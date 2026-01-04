import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/app/lib/db";
import { requireAuth } from "@/app/lib/requireAuth";
import { contactService } from "@/app/services/ContactService";
import { User } from "@/app/models/User";

/**
 * GET /api/contacts
 * Get paginated contacts with search and filters
 * Query params: page, limit, search, tags (comma-separated IDs)
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

    const { searchParams } = new URL(req.url);

    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const search = searchParams.get("search") || "";
    const tagsParam = searchParams.get("tags") || "";
    const tags = tagsParam ? tagsParam.split(",") : [];

    const result = await contactService.getContacts(userId, {
      page,
      limit,
      search,
      tags,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[CONTACTS] GET Error:", error.message);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

/**
 * POST /api/contacts
 * Create a new contact
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

    const body = await req.json();

    const contact = await contactService.createContact({
      ...body,
      createdBy: userId,
    });

    return NextResponse.json(contact, { status: 201 });
  } catch (error: any) {
    console.error("[CONTACTS] POST Error:", error.message);
    const status = error.message.includes("already exists") ? 409 : 400;
    return NextResponse.json({ message: error.message }, { status });
  }
}
