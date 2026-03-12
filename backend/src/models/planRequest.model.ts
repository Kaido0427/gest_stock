import mongoose, { Document, Schema, Types } from "mongoose";

export type PlanRequestStatus = "pending" | "approved" | "rejected";

export interface IPlanRequest extends Document {
    tenant_id: Types.ObjectId;
    currentPlan: string;
    requestedPlan: string;
    status: PlanRequestStatus;
    message?: string;          // message du tenant
    adminNote?: string;        // note de l'admin
    processedBy?: Types.ObjectId;
    processedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const PlanRequestSchema = new Schema<IPlanRequest>(
    {
        tenant_id: {
            type: Schema.Types.ObjectId,
            ref: "Tenant",
            required: true,
            index: true,
        },
        currentPlan: { type: String, required: true },
        requestedPlan: { type: String, required: true },
        status: {
            type: String,
            enum: ["pending", "approved", "rejected"],
            default: "pending",
        },
        message: { type: String, trim: true },
        adminNote: { type: String, trim: true },
        processedBy: { type: Schema.Types.ObjectId, ref: "User" },
        processedAt: { type: Date },
    },
    { timestamps: true }
);

// Index pour éviter les doublons de demandes en attente
PlanRequestSchema.index({ tenant_id: 1, status: 1 });

export const PlanRequest = mongoose.model<IPlanRequest>("PlanRequest", PlanRequestSchema);