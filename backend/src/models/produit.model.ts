import mongoose, { Document, Schema, Types } from "mongoose";

// ✅ Interface pour les variantes
interface IVariant {
    _id?: Types.ObjectId; // Ajouter _id optionnel
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
        variants: [VariantSchema]
    },
    { 
        timestamps: true
    }
);

export const Produit = mongoose.model<IProduit>("Produit", ProduitSchema);