import mongoose, { Document, Schema, Types } from "mongoose";

// ✅ Interface pour les variantes
interface IVariant {
    _id?: Types.ObjectId;
    name: string;
    price: number;
    stock: number;
}

// ✅ Interface principale
interface IProduit extends Document {
    name: string;
    description?: string;
    category?: string;
    variants: IVariant[];
    boutique_id: Types.ObjectId; // ✅ Nouveau champ
    createdAt: Date;
    updatedAt: Date;
    metadata?: {
        source?: string;
        clientId?: string;
        localId?: string;
        syncId?: string;
    };
}

const VariantSchema = new Schema<IVariant>(
    {
        name: { 
            type: String, 
            required: true,
            trim: true 
        },
        price: { 
            type: Number, 
            required: true, 
            min: 0 
        },
        stock: { 
            type: Number, 
            required: true, 
            default: 0,
            min: 0 
        }
    },
    { _id: true }
);

const ProduitSchema = new Schema<IProduit>(
    {
        name: { 
            type: String, 
            required: true, 
            trim: true 
        },
        description: { 
            type: String, 
            trim: true 
        },
        category: { 
            type: String, 
            trim: true 
        },
        variants: [VariantSchema],
        boutique_id: { // ✅ Nouveau champ
            type: Schema.Types.ObjectId,
            ref: "Boutique",
            required: true
        },
        metadata: {
            type: Schema.Types.Mixed,
            default: {}
        }
    },
    { 
        timestamps: true
    }
);

export const Produit = mongoose.model<IProduit>("Produit", ProduitSchema);
export type { IProduit };