import mongoose, { Document, Schema, Types } from "mongoose";

// ✅ Interface pour les items vendus - AVEC conversion
interface IItemVendu {
    productId: Types.ObjectId;
    productName: string;
    
    // ✅ Quantité et unité DE VENTE (ce que le client achète)
    quantitySold: number;
    unitSold: string; // L'unité choisie à la vente (peut être différente de l'unité de base)
    
    // ✅ Quantité déductible du stock (convertie en unité de base)
    quantityDeducted: number;
    unitBase: string; // L'unité de base du produit
    
    // ✅ Prix
    unitPrice: number; // Prix par unité vendue
    total: number;
}

// Interface pour une vente
interface IVente {
    boutique_id: Types.ObjectId;
    items: IItemVendu[];
    totalAmount: number;
    date: Date;
}

interface IVenteDocument extends IVente, Document { }

const ItemVenduSchema = new Schema<IItemVendu>(
    {
        productId: {
            type: Schema.Types.ObjectId,
            ref: 'Produit',
            required: true
        },
        productName: {
            type: String,
            required: true
        },
        quantitySold: {
            type: Number,
            required: true,
            min: 0
        },
        unitSold: {
            type: String,
            required: true
        },
        quantityDeducted: {
            type: Number,
            required: true,
            min: 0
        },
        unitBase: {
            type: String,
            required: true
        },
        unitPrice: {
            type: Number,
            required: true,
            min: 0
        },
        total: {
            type: Number,
            required: true,
            min: 0
        }
    },
    { _id: false }
);

const VenteSchema = new Schema<IVenteDocument>(
    {
        boutique_id: {
            type: Schema.Types.ObjectId,
            ref: "Boutique",
            required: true
        },
        items: [ItemVenduSchema],
        totalAmount: {
            type: Number,
            required: true,
            min: 0
        },
        date: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

// Virtual pour compter le nombre d'articles
VenteSchema.virtual("itemsCount").get(function () {
    return this.items.reduce((total, item) => total + item.quantitySold, 0);
});

// Index pour les recherches
VenteSchema.index({ date: -1 });
VenteSchema.index({ totalAmount: -1 });
VenteSchema.index({ boutique_id: 1, date: -1 });

export const Vente = mongoose.model<IVenteDocument>("Vente", VenteSchema);
export type { IVente, IVenteDocument, IItemVendu };