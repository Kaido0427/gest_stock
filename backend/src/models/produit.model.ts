import mongoose, { Document, Schema, Types } from "mongoose";

export enum UnitType {
    LITRE = "L",
    CENTILITRE = "cL",
    MILLILITRE = "mL",
    KILOLITRE = "kL",
    KILOGRAMME = "kg",
    GRAMME = "g",
    MILLIGRAMME = "mg",
    TONNE = "t",
    PIECE = "pièce",
    SACHET = "sachet",
    BOUTEILLE = "bouteille",
    CARTON = "carton",
    PAQUET = "paquet",
    BOITE = "boîte",
}

export interface IProduit extends Document {
    name: string;
    description?: string;
    category?: string;
    stock: number;
    unit: UnitType;
    basePrice: number;
    tenant_id: Types.ObjectId;
    boutique_id: Types.ObjectId;
    metadata?: {
        source?: string;
        clientId?: string;
        localId?: string;
        syncId?: string;
    };
    createdAt: Date;
    updatedAt: Date;
}

const ProduitSchema = new Schema<IProduit>(
    {
        name: { type: String, required: true, trim: true },
        description: { type: String, trim: true },
        category: { type: String, trim: true },
        stock: { type: Number, required: true, default: 0 },
        unit: { type: String, enum: Object.values(UnitType), required: true },
        basePrice: { type: Number, required: true, min: 0 },
        tenant_id: { type: Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
        boutique_id: { type: Schema.Types.ObjectId, ref: "Boutique", required: true },
        metadata: { type: Schema.Types.Mixed, default: {} },
    },
    { timestamps: true }
);

ProduitSchema.index({ tenant_id: 1, boutique_id: 1 });
ProduitSchema.index({ tenant_id: 1, boutique_id: 1, name: 1 });
ProduitSchema.index({ tenant_id: 1, stock: 1 });

export const Produit = mongoose.model<IProduit>("Produit", ProduitSchema);