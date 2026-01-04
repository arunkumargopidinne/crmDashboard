import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "../../../lib/db";
import { requireAuth } from "../../../lib/requireAuth";
import { User } from "../../../models/User";

/**
 * Sync Firebase-authenticated user into MongoDB `users` collection.
 *
 * Strategy:
 * - Prefer email-based lookup to avoid creating duplicate null `firebaseUid` documents
 * - Only set `firebaseUid` when a valid `uid` exists
 * - Avoid performing index DDL here; migration endpoint exists to fix indexes
 * - If a create fails due to duplicate-null `firebaseUid`, merge into an existing null-uid document
 */
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const decoded = await requireAuth(req);
    const { uid, email, name, picture, firebase } = decoded;

    if (!email) {
      return NextResponse.json({ message: "Email missing in token" }, { status: 400 });
    }

    const provider = firebase?.sign_in_provider === "google.com" ? "google" : "password";

    // Normalize uid
    const saneUid = uid && uid !== "undefined" ? String(uid) : null;

    // First, try to find by email (preferred)
    let userDoc = await User.findOne({ email }).exec();

    if (userDoc) {
      // Update existing user (do not overwrite firebaseUid unless we have a sane uid)
      const update: any = {
        email,
        displayName: name || "",
        photoURL: picture || "",
        provider,
      };
      if (saneUid) update.firebaseUid = saneUid;

      const updated = await User.findByIdAndUpdate(userDoc._id, update, { new: true }).lean();
      console.log(`[SYNC] Updated user by email: ${email}${saneUid ? ` (uid ${saneUid})` : ""}`);
      return NextResponse.json({ message: "User updated", user: updated });
    }

    // No user by email. If we have a uid, try to find by firebaseUid
    if (saneUid) {
      userDoc = await User.findOne({ firebaseUid: saneUid }).exec();
      if (userDoc) {
        const updated = await User.findByIdAndUpdate(
          userDoc._id,
          { email, displayName: name || "", photoURL: picture || "", provider },
          { new: true }
        ).lean();
        console.log(`[SYNC] Updated user by firebaseUid: ${saneUid}`);
        return NextResponse.json({ message: "User updated", user: updated });
      }
    }

    // No existing user found. Instead of blindly creating (which can fail due to
    // legacy non-sparse `uid` index with nulls), try to find an existing
    // placeholder document with null `firebaseUid` or legacy `uid` and merge
    // into it. Only create when no candidate exists.
    const toCreate: any = {
      email,
      displayName: name || "",
      photoURL: picture || "",
      provider,
    };
    if (saneUid) toCreate.firebaseUid = saneUid;

    // Look for an existing 'placeholder' user created earlier that has
    // either `firebaseUid: null` or legacy `uid: null` to merge into.
    const nullCandidate = await User.findOne({
      $or: [{ firebaseUid: null }, { uid: null }],
    }).exec();

    if (nullCandidate) {
      const merged = await User.findByIdAndUpdate(
        nullCandidate._id,
        { email, displayName: name || "", photoURL: picture || "", provider, ...(saneUid ? { firebaseUid: saneUid } : {}) },
        { new: true }
      ).lean();
      console.log(`[SYNC] Merged into existing null-uid user: ${merged._id}`);
      return NextResponse.json({ message: "User merged", user: merged });
    }

    // No null placeholder found — safe to create
    const created = await User.create(toCreate);
    console.log(`[SYNC] Created new user: ${email}${saneUid ? ` (uid ${saneUid})` : ""}`);
    return NextResponse.json({ message: "User created", user: created }, { status: 201 });
  } catch (err: any) {
    console.error("[SYNC] Error:", err);
    const msg = err?.message || "Unauthorized";
    if (msg.includes("Firebase Admin") || msg.includes("not configured")) {
      return NextResponse.json({ message: msg }, { status: 500 });
    }
    if (msg.toLowerCase().includes("mongo") || msg.toLowerCase().includes("connection")) {
      return NextResponse.json({ message: msg }, { status: 500 });
    }
    return NextResponse.json({ message: msg }, { status: 401 });
  }
}
