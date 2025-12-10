import mongoose from "mongoose";

const UnitSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },         // nom de l’unité (ex: 500ml, Bidon 5L)
        quantityPerUnit: { type: Number, required: true, min: 0 }, // conversion en unité de base
        price: { type: Number, required: true, min: 0 },           // prix de cette unité
    },
    { _id: false }
);

const LotSchema = new mongoose.Schema(
    {
        name: { type: String },                        // optionnel : numéro de lot
        quantity: { type: Number, required: true, min: 0 }, // quantité en unité de base
        createdAt: { type: Date, defaault: Date.now },
        expirationDate: { type: Date },               // optionnel pour produits périssables
    },
    { _id: false }
);

const ProduitSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        description: { type: String, trim: true },
        category: { type: String, trim: true },
        stockBase: { type: Number, required: true, min: 0 }, // stock total en unité de base
        baseUnit: { type: String, required: true },          // unité de base (L, kg, pièce…)
        units: [UnitSchema],
        lots: [LotSchema],
    },
    { timestamps: true }
);

export const Produit = mongoose.model("Produit", ProduitSchema);