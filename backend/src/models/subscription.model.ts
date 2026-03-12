import mongoose, { Document, Schema, Types } from "mongoose";
import type { PlanType } from "../utils/plan.limits";

export type SubscriptionStatus = "active" | "cancelled" | "expired";

export interface ISubscription extends Document {
    tenant_id: Types.ObjectId;
    plan: PlanType;
    status: SubscriptionStatus;
    amount: number;
    currency: string;
    startsAt: Date;
    expiresAt: Date;
    paymentRef?: string;
    createdAt: Date;
    updatedAt: Date;
}

const SubscriptionSchema = new Schema<ISubscription>(
    {
        tenant_id: { type: Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
        plan: { type: String, enum: ["starter", "business", "enterprise"], required: true },
        status: { type: String, enum: ["active", "cancelled", "expired"], default: "active" },
        amount: { type: Number, required: true },
        currency: { type: String, default: "XOF" },
        startsAt: { type: Date, required: true },
        expiresAt: { type: Date, required: true },
        paymentRef: { type: String, trim: true },
    },
    { timestamps: true }
);

export const Subscription = mongoose.model<ISubscription>("Subscription", SubscriptionSchema);