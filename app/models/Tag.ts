import mongoose, { Schema, models, model } from "mongoose";

const TagSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    color: { type: String, default: "#3B82F6" }, // Tailwind blue-500
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    count: { type: Number, default: 0 }, // Denormalized: number of contacts with this tag
  },
  { timestamps: true }
);

// Ensure uniqueness per user
TagSchema.index({ name: 1, createdBy: 1 }, { unique: true });
TagSchema.index({ createdBy: 1 });

export const Tag = models.Tag || model("Tag", TagSchema);
