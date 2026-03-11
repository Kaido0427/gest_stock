import mongoose, { Document, Schema, Types } from "mongoose";

export interface IBoutique extends Document {
    name: string;
    description?: string;
    address?: string;
    phone?: string;
    tenant_id: Types.ObjectId;
    responsable_id?: Types.ObjectId;
    isMain: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const BoutiqueSchema = new Schema<IBoutique>(
    {
        name: { type: String, required: true, trim: true },
        description: { type: String, trim: true },
        address: { type: String, trim: true },
        phone: { type: String, trim: true },
        tenant_id: { type: Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
        responsable_id: { type: Schema.Types.ObjectId, ref: "User" },
        isMain: { type: Boolean, default: false },
    },
    { timestamps: true }
);

BoutiqueSchema.index({ tenant_id: 1, name: 1 });

export const Boutique = mongoose.model<IBoutique>("Boutique", BoutiqueSchema);