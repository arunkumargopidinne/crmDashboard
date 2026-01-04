import mongoose, { Schema, models, model } from "mongoose";

const ContactSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, default: "" },
    company: { type: String, default: "" },
    tags: [{ type: Schema.Types.ObjectId, ref: "Tag" }],
    notes: { type: String, default: "" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    lastInteraction: { type: Date, default: null },
  },
  { timestamps: true }
);

// Text index for full-text search
ContactSchema.index({ name: "text", email: "text", company: "text" });

// Indexes for filtering and querying
ContactSchema.index({ createdBy: 1 });
ContactSchema.index({ createdBy: 1, createdAt: -1 });
ContactSchema.index({ email: 1, createdBy: 1 });
ContactSchema.index({ tags: 1 });

export const Contact = models.Contact || model("Contact", ContactSchema);
