import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/app/lib/db";
import { requireAuth } from "@/app/lib/requireAuth";
import { contactService } from "@/app/services/ContactService";

/**
 * GET /api/contacts
 * Get paginated contacts with search and filters
 * Query params: page, limit, search, tags (comma-separated IDs)
 */
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const decoded = await requireAuth(req);
    const { searchParams } = new URL(req.url);

    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const search = searchParams.get("search") || "";
    const tagsParam = searchParams.get("tags") || "";
    const tags = tagsParam ? tagsParam.split(",") : [];

    const result = await contactService.getContacts(decoded.uid, {
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
    const body = await req.json();

    const contact = await contactService.createContact({
      ...body,
      createdBy: decoded.uid,
    });

    return NextResponse.json(contact, { status: 201 });
  } catch (error: any) {
    console.error("[CONTACTS] POST Error:", error.message);
    const status = error.message.includes("already exists") ? 409 : 400;
    return NextResponse.json({ message: error.message }, { status });
  }
}
