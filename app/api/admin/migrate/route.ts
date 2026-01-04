import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/app/lib/db";
import { User } from "@/app/models/User";

/**
 * POST /api/admin/migrate
 * Migration endpoint to fix database issues
 * Use this once to clean up old indexes
 */
export async function POST(req: NextRequest) {
  try {
    // Simple auth - check for admin header (in production use proper auth)
    const adminKey = req.headers.get("x-admin-key");
    if (adminKey !== process.env.ADMIN_KEY) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectDB();

    console.log("[MIGRATE] Starting migration...");

    // Drop the old unique index on firebaseUid if it exists
    try {
      const indexInfo = await User.collection.getIndexes();
      console.log("[MIGRATE] Current indexes:", indexInfo);

      // Find and drop the old firebaseUid_1 index
      if (indexInfo.firebaseUid_1) {
        await User.collection.dropIndex("firebaseUid_1");
        console.log("[MIGRATE] Dropped old firebaseUid_1 index");
      }

      // Drop any sparse index variants
      for (const [indexName, indexSpec] of Object.entries(indexInfo)) {
        if (indexName.includes("firebaseUid")) {
          try {
            await User.collection.dropIndex(indexName);
            console.log(`[MIGRATE] Dropped index ${indexName}`);
          } catch (e) {
            console.log(`[MIGRATE] Could not drop ${indexName}`, e);
          }
        }
      }
    } catch (error) {
      console.log("[MIGRATE] Error checking/dropping indexes:", error);
    }

    // Force Mongoose to recreate indexes from schema
    await User.syncIndexes();
    console.log("[MIGRATE] Synced indexes from schema");

    // Remove duplicate null firebaseUid documents (keep first)
    const nullUsers = await User.find({ firebaseUid: null }).lean();
    if (nullUsers.length > 1) {
      const idsToRemove = nullUsers.slice(1).map((u) => u._id);
      const deleteResult = await User.deleteMany({
        _id: { $in: idsToRemove },
      });
      console.log(
        `[MIGRATE] Removed ${deleteResult.deletedCount} duplicate null firebaseUid users`
      );
    }

    return NextResponse.json({
      message: "Migration completed successfully",
      removedDuplicates: Math.max(0, nullUsers.length - 1),
    });
  } catch (error: any) {
    console.error("[MIGRATE] Error:", error.message);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
