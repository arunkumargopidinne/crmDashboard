import mongoose, { Schema, models, model } from "mongoose";

const UserSchema = new Schema(
  {
    firebaseUid: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, index: true },
    displayName: { type: String, default: "" },
    photoURL: { type: String, default: "" },
    provider: { type: String, enum: ["password", "google"], default: "password" },
    preferences: { type: Object, default: {} },
  },
  { timestamps: true }
);

export const User = models.User || model("User", UserSchema);
