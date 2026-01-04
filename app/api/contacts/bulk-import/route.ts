import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/app/lib/db";
import { requireAuth } from "@/app/lib/requireAuth";
import { contactService } from "@/app/services/ContactService";
import { Contact } from "@/app/models/Contact";

/**
 * POST /api/contacts/bulk-import
 * Import contacts from CSV data
 * Body: { contacts: Array<{name, email, phone?, company?, tags?, notes?}> }
 */
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const decoded = await requireAuth(req);
    const { contacts } = await req.json();

    if (!Array.isArray(contacts)) {
      return NextResponse.json(
        { message: "Contacts must be an array" },
        { status: 400 }
      );
    }

    if (contacts.length === 0) {
      return NextResponse.json(
        { message: "No contacts to import" },
        { status: 400 }
      );
    }

    if (contacts.length > 5000) {
      return NextResponse.json(
        { message: "Maximum 5000 contacts per import" },
        { status: 400 }
      );
    }

    const result = await contactService.bulkImportContacts(
      contacts,
      decoded.uid
    );

    const status =
      result.failedCount === 0 && result.successCount > 0 ? 200 : 207;

    return NextResponse.json(result, { status });
  } catch (error: any) {
    console.error("[CONTACTS] Bulk Import Error:", error.message);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
