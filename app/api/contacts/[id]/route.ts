import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/app/lib/db";
import { requireAuth } from "@/app/lib/requireAuth";
import { contactService } from "@/app/services/ContactService";

/**
 * GET /api/contacts/:id
 * Get a specific contact
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const decoded = await requireAuth(req);
    const contact = await contactService.getContactById(params.id, decoded.uid);

    return NextResponse.json(contact);
  } catch (error: any) {
    console.error("[CONTACTS] GET/:id Error:", error.message);
    const status = error.message.includes("not found") ? 404 : 500;
    return NextResponse.json({ message: error.message }, { status });
  }
}

/**
 * PUT /api/contacts/:id
 * Update a contact
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const decoded = await requireAuth(req);
    const body = await req.json();

    const contact = await contactService.updateContact({
      id: params.id,
      createdBy: decoded.uid,
      ...body,
    });

    return NextResponse.json(contact);
  } catch (error: any) {
    console.error("[CONTACTS] PUT/:id Error:", error.message);
    const status = error.message.includes("not found")
      ? 404
      : error.message.includes("already exists")
        ? 409
        : 400;
    return NextResponse.json({ message: error.message }, { status });
  }
}

/**
 * DELETE /api/contacts/:id
 * Delete a contact
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const decoded = await requireAuth(req);
    await contactService.deleteContact(params.id, decoded.uid);

    return NextResponse.json({
      message: "Contact deleted successfully",
    });
  } catch (error: any) {
    console.error("[CONTACTS] DELETE/:id Error:", error.message);
    const status = error.message.includes("not found") ? 404 : 500;
    return NextResponse.json({ message: error.message }, { status });
  }
}
