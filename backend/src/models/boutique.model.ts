import mongoose, { Document, Schema, Types } from "mongoose";

interface IBoutique extends Document {
    name: string;
    description?: string;
    address?: string;
    phone?: string;
    responsable_id: Types.ObjectId; 
    createdAt: Date;
    updatedAt: Date;
}

const BoutiqueSchema = new Schema<IBoutique>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            unique: true
        },
        description: {
            type: String,
            trim: true
        },
        address: {
            type: String,
            trim: true
        },
        phone: {
            type: String,
            trim: true
        },
        responsable_id: { 
            type: Schema.Types.ObjectId,
            ref: "User", // Référence au modèle User
            required: true
        }
    },
    {
        timestamps: true
    }
);

export const Boutique = mongoose.model<IBoutique>("Boutique", BoutiqueSchema);
export type { IBoutique };