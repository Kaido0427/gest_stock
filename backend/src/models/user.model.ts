import mongoose, { Document, Schema, Types } from "mongoose";

export type UserRole = "super_admin" | "owner" | "manager" | "employe";

export interface IUser extends Document {
  email: string;
  password: string;
  name?: string;
  role: UserRole;
  tenant_id?: Types.ObjectId;
  boutique_id?: Types.ObjectId; // boutique assignée (employe/manager)
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    name: { type: String, trim: true },
    role: {
      type: String,
      enum: ["super_admin", "owner", "manager", "employe"],
      default: "employe",
    },
    tenant_id: { type: Schema.Types.ObjectId, ref: "Tenant", index: true },
    boutique_id: { type: Schema.Types.ObjectId, ref: "Boutique" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>("User", UserSchema);