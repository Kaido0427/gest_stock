import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["admin", "employe"], default: "employe" }
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
