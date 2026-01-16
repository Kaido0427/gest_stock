import mongoose, { Document, Schema, Types } from "mongoose";

// Interface pour les items vendus
interface IItemVendu {
    productId: Types.ObjectId;
    variantId: Types.ObjectId;
    productName: string;
    variantName: string;
    quantity: number;
    price: number;
    total: number;
}

// Interface pour une vente
interface IVente {
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
        variantId: {
            type: Schema.Types.ObjectId,
            required: true
        },
        productName: {
            type: String,
            required: true
        },
        variantName: {
            type: String,
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        price: {
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
    return this.items.reduce((total, item) => total + item.quantity, 0);
});

// Index pour les recherches par date
VenteSchema.index({ date: -1 });
VenteSchema.index({ totalAmount: -1 });

export const Vente = mongoose.model<IVenteDocument>("Vente", VenteSchema);