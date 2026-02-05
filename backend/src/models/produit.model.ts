import mongoose, { Document, Schema, Types } from "mongoose";

// ✅ Énumération des unités possibles
enum UnitType {
    // Liquides
    LITRE = "L",
    CENTILITRE = "cL",
    MILLILITRE = "mL",
    KILOLITRE = "kL",

    // Solides/Poids
    KILOGRAMME = "kg",
    GRAMME = "g",
    MILLIGRAMME = "mg",
    TONNE = "t",

    // Comptables
    PIECE = "pièce",
    SACHET = "sachet",
    BOUTEILLE = "bouteille",
    CARTON = "carton",
    PAQUET = "paquet",
    BOITE = "boîte"
}

// ✅ Interface principale SIMPLIFIÉE
interface IProduit extends Document {
    name: string;
    description?: string;
    category?: string;

    // ✅ Stock simplifié - quantité physique réelle
    stock: number;
    unit: UnitType; // L'unité de base du produit

    // ✅ Prix de base (par unité de base)
    basePrice: number;

    boutique_id: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
    metadata?: {
        source?: string;
        clientId?: string;
        localId?: string;
        syncId?: string;
    };
}

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
        stock: {
            type: Number,
            required: true,
            default: 0,
            min: 0
        },
        unit: {
            type: String,
            enum: Object.values(UnitType),
            required: true
        },
        basePrice: {
            type: Number,
            required: true,
            min: 0
        },
        boutique_id: {
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

// ✅ Index pour les recherches
ProduitSchema.index({ boutique_id: 1, category: 1 });
ProduitSchema.index({ boutique_id: 1, name: 1 });

export const Produit = mongoose.model<IProduit>("Produit", ProduitSchema);
export { UnitType };
export type { IProduit };