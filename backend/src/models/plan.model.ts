import mongoose, { Document, Schema } from "mongoose";

export interface IPlanFeatures {
    transfertInterBoutiques: boolean;
    statsAvancees: boolean;
    export: boolean;
    // extensible : l'admin peut ajouter d'autres features via metadata
    [key: string]: boolean | number;
}

export interface IPlan extends Document {
    name: string;              // ex: "starter", "business", "enterprise", "flexible"
    label: string;             // ex: "Starter", "Business Pro"
    price: number;             // XOF / mois
    currency: string;
    isActive: boolean;         // visible ou non pour les tenants
    isDefault: boolean;        // plan assigné à la création d'un tenant
    limits: {
        boutiques: number;     // -1 = illimité
        produits: number;
        employes: number;
        historiqueJours: number;
    };
    features: IPlanFeatures;
    description?: string;
    color?: string;            // pour l'UI : "blue", "purple", etc.
    sortOrder: number;         // ordre d'affichage
    createdAt: Date;
    updatedAt: Date;
}

const PlanSchema = new Schema<IPlan>(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        label: { type: String, required: true, trim: true },
        price: { type: Number, required: true, min: 0 },
        currency: { type: String, default: "XOF" },
        isActive: { type: Boolean, default: true },
        isDefault: { type: Boolean, default: false },
        limits: {
            boutiques: { type: Number, default: 1 },
            produits: { type: Number, default: 100 },
            employes: { type: Number, default: 2 },
            historiqueJours: { type: Number, default: 30 },
        },
        features: {
            type: Schema.Types.Mixed,
            default: {
                transfertInterBoutiques: false,
                statsAvancees: false,
                export: false,
            },
        },
        description: { type: String, trim: true },
        color: { type: String, default: "slate" },
        sortOrder: { type: Number, default: 0 },
    },
    { timestamps: true }
);

export const Plan = mongoose.model<IPlan>("Plan", PlanSchema);