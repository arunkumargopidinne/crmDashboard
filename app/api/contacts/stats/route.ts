import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/app/lib/db";
import { requireAuth } from "@/app/lib/requireAuth";
import { contactService } from "@/app/services/ContactService";

/**
 * GET /api/contacts/stats/dashboard
 * Get dashboard statistics
 */
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const decoded = await requireAuth(req);

    const [stats, byCompany, timeline] = await Promise.all([
      contactService.getDashboardStats(decoded.uid),
      contactService.getContactsByCompany(decoded.uid),
      contactService.getContactsTimeline(decoded.uid, 30),
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
