import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/app/lib/db";
import { requireAuth } from "@/app/lib/requireAuth";
import { contactService } from "@/app/services/ContactService";

/**
 * POST /api/contacts/bulk-delete
 * Delete multiple contacts
 * Body: { ids: string[] }
 */
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const decoded = await requireAuth(req);
    const { ids } = await req.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { message: "Invalid or empty IDs array" },
        { status: 400 }
      );
    }

    const result = await contactService.bulkDeleteContacts(ids, decoded.uid);

    return NextResponse.json({
      message: `${result.deletedCount} contacts deleted successfully`,
      deletedCount: result.deletedCount,
    });
  } catch (error: any) {
    console.error("[CONTACTS] Bulk Delete Error:", error.message);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
