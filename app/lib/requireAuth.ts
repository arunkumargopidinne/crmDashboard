import { NextRequest } from "next/server";
import admin from "./firebaseAdmin";

export async function requireAuth(req: NextRequest) {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    throw new Error("Missing token");
  }

  if (!admin.apps.length) {
    throw new Error("Firebase Admin SDK not configured on server. Set FIREBASE_ADMIN_* env vars or FIREBASE_ADMIN_SERVICE_ACCOUNT.");
  }

  const decoded = await admin.auth().verifyIdToken(token);
  return decoded; // { uid, email, name, picture, ... }
}
