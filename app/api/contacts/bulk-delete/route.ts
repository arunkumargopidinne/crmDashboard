import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/app/lib/db";
import { requireAuth } from "@/app/lib/requireAuth";
import { contactService } from "@/app/services/ContactService";
import { User } from "@/app/models/User";

/**
 * POST /api/contacts/bulk-delete
 * Delete multiple contacts
 * Body: { ids: string[] }
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
    const { ids } = await req.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { message: "Invalid or empty IDs array" },
        { status: 400 }
      );
    }

    const result = await contactService.bulkDeleteContacts(ids, userId);

    return NextResponse.json({
      message: `${result.deletedCount} contacts deleted successfully`,
      deletedCount: result.deletedCount,
    });
  } catch (error: any) {
    console.error("[CONTACTS] Bulk Delete Error:", error.message);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
