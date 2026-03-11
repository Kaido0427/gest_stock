import mongoose, { Document, Schema, Types } from "mongoose";

export interface IVenteItem {
    productId: Types.ObjectId;
    productName: string;
    quantitySold: number;
    unitSold: string;
    quantityDeducted: number;
    unitBase: string;
    unitPrice: number;
    total: number;
}

export interface IVente extends Document {
    tenant_id: Types.ObjectId;
    boutique_id: Types.ObjectId;
    items: IVenteItem[];
    totalAmount: number;
    date: Date;
    createdAt: Date;
    updatedAt: Date;
}

const VenteItemSchema = new Schema<IVenteItem>(
    {
        productId: { type: Schema.Types.ObjectId, ref: "Produit", required: true },
        productName: { type: String, required: true },
        quantitySold: { type: Number, required: true },
        unitSold: { type: String, required: true },
        quantityDeducted: { type: Number, required: true },
        unitBase: { type: String, required: true },
        unitPrice: { type: Number, required: true },
        total: { type: Number, required: true },
    },
    { _id: false }
);

const VenteSchema = new Schema<IVente>(
    {
        tenant_id: { type: Schema.Types.ObjectId, ref: "Tenant", required: true, index: true },
        boutique_id: { type: Schema.Types.ObjectId, ref: "Boutique", required: true },
        items: { type: [VenteItemSchema], required: true },
        totalAmount: { type: Number, required: true },
        date: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

VenteSchema.index({ tenant_id: 1, date: -1 });
VenteSchema.index({ tenant_id: 1, boutique_id: 1, date: -1 });

export const Vente = mongoose.model<IVente>("Vente", VenteSchema);