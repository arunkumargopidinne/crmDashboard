import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/app/lib/db";
import { requireAuth } from "@/app/lib/requireAuth";
import { contactService } from "@/app/services/ContactService";
import { User } from "@/app/models/User";

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

    // Map Firebase decoded token to MongoDB user _id
    const mongoUser =
      (await User.findOne({ firebaseUid: decoded.uid })) ||
      (decoded.email ? await User.findOne({ email: decoded.email }) : null);

    if (!mongoUser) {
      throw new Error("User not found in database");
    }

    const userId = mongoUser._id.toString();

    const contact = await contactService.getContactById(params.id, userId);

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

    // Map Firebase decoded token to MongoDB user _id
    const mongoUser =
      (await User.findOne({ firebaseUid: decoded.uid })) ||
      (decoded.email ? await User.findOne({ email: decoded.email }) : null);

    if (!mongoUser) {
      throw new Error("User not found in database");
    }

    const userId = mongoUser._id.toString();
    const body = await req.json();

    const contact = await contactService.updateContact({
      id: params.id,
      createdBy: userId,
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

    // Map Firebase decoded token to MongoDB user _id
    const mongoUser =
      (await User.findOne({ firebaseUid: decoded.uid })) ||
      (decoded.email ? await User.findOne({ email: decoded.email }) : null);

    if (!mongoUser) {
      throw new Error("User not found in database");
    }

    const userId = mongoUser._id.toString();

    await contactService.deleteContact(params.id, userId);

    return NextResponse.json({
      message: "Contact deleted successfully",
    });
  } catch (error: any) {
    console.error("[CONTACTS] DELETE/:id Error:", error.message);
    const status = error.message.includes("not found") ? 404 : 500;
    return NextResponse.json({ message: error.message }, { status });
  }
}
