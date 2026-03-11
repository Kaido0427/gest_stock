import mongoose, { Document, Schema } from "mongoose";
import type { PlanType } from "../utils/plan.limits.js";

export type TenantStatus = "trial" | "active" | "suspended" | "expired";

export interface ITenant extends Document {
    name: string;
    ownerEmail: string;
    plan: PlanType;
    status: TenantStatus;
    trialEndsAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

const TenantSchema = new Schema<ITenant>(
    {
        name: { type: String, required: true, trim: true },
        ownerEmail: { type: String, required: true, unique: true, lowercase: true },
        plan: {
            type: String,
            enum: ["starter", "business", "enterprise"],
            default: "starter",
        },
        status: {
            type: String,
            enum: ["trial", "active", "suspended", "expired"],
            default: "trial",
        },
        trialEndsAt: {
            type: Date,
            default: () => new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 jours
        },
    },
    { timestamps: true }
);

export const Tenant = mongoose.model<ITenant>("Tenant", TenantSchema);