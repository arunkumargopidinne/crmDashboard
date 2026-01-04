import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/app/lib/db";
import { requireAuth } from "@/app/lib/requireAuth";
import { contactService } from "@/app/services/ContactService";
import { User } from "@/app/models/User";

/**
 * GET /api/contacts/stats/dashboard
 * Get dashboard statistics
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

    const [stats, byCompany, timeline] = await Promise.all([
      contactService.getDashboardStats(userId),
      contactService.getContactsByCompany(userId),
      contactService.getContactsTimeline(userId, 30),
    ]);

    return NextResponse.json({
      stats,
      byCompany,
      timeline,
    });
  } catch (error: any) {
    console.error("[CONTACTS] Stats Error:", error.message);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
