import type { Context } from "hono";
import { Produit } from "../models/produit.model.js";
import mongoose from "mongoose";

// Type pour les données de variante dans les requêtes
interface VariantData {
    _id?: string;
    name: string;
    price: number;
    stock: number;
}

// ➤ 1. Créer un produit
export const createProduit = async (c: Context) => {
    try {
        const body = await c.req.json();

        // Validation : au moins une variante est requise
        if (!body.variants || body.variants.length === 0) {
            return c.json({
                error: "Le produit doit avoir au moins une variante"
            }, 400);
        }

        // Validation : noms de variantes uniques dans ce produit
        const variantNames = body.variants.map((v: VariantData) => v.name.toLowerCase());
        const uniqueNames = new Set(variantNames);

        if (variantNames.length !== uniqueNames.size) {
            return c.json({
                error: "Les noms des variantes doivent être uniques dans un produit"
            }, 400);
        }

        const produit = await Produit.create(body);
        return c.json({
            message: "Produit créé avec succès",
            produit
        }, 201);
    } catch (error) {
        const err = error as Error;
        return c.json({ error: err.message }, 500);
    }
};

// ➤ 2. Voir un produit par ID
export const getProduit = async (c: Context) => {
    try {
        const id = c.req.param("id");
        const produit = await Produit.findById(id);

        if (!produit) return c.json({ error: "Produit introuvable" }, 404);
        return c.json(produit);
    } catch (error) {
        const err = error as Error;
        return c.json({ error: err.message }, 500);
    }
};

// ➤ 3. Voir tous les produits
export const getAllProduits = async (c: Context) => {
    try {
        const produits = await Produit.find();
        return c.json(produits);
    } catch (error) {
        const err = error as Error;
        return c.json({ error: err.message }, 500);
    }
};

// ➤ 4. Mettre à jour un produit
export const updateProduit = async (c: Context) => {
    try {
        const id = c.req.param("id");
        const body = await c.req.json();

        const produit = await Produit.findById(id);
        if (!produit) return c.json({ error: "Produit introuvable" }, 404);

        // ✅ Mise à jour des champs simples
        const simpleFields = ["name", "description", "category"];
        simpleFields.forEach((field) => {
            if (body[field] !== undefined) {
                (produit as any)[field] = body[field];
            }
        });

        // ✅ Mise à jour des variantes
        if (Array.isArray(body.variants)) {
            // Vérifier les noms uniques
            const variantNames = body.variants.map((v: VariantData) => v.name.toLowerCase());
            const uniqueNames = new Set(variantNames);

            if (variantNames.length !== uniqueNames.size) {
                return c.json({
                    error: "Les noms des variantes doivent être uniques"
                }, 400);
            }

            // Mettre à jour ou ajouter des variantes
            body.variants.forEach((variantData: VariantData) => {
                // Si la variante a un _id, c'est une mise à jour
                if (variantData._id) {
                    // Trouver la variante par son _id
                    const existingVariant = produit.variants.find(
                        v => v._id && v._id.toString() === variantData._id
                    );

                    if (existingVariant) {
                        existingVariant.name = variantData.name ?? existingVariant.name;
                        existingVariant.price = variantData.price ?? existingVariant.price;
                        existingVariant.stock = variantData.stock ?? existingVariant.stock;
                    }
                } else {
                    // Sinon, c'est une nouvelle variante
                    produit.variants.push({
                        name: variantData.name,
                        price: variantData.price,
                        stock: variantData.stock || 0
                    });
                }
            });
        }

        await produit.save();
        return c.json({
            message: "Produit mis à jour avec succès",
            produit
        });
    } catch (error) {
        const err = error as Error;
        return c.json({ error: err.message }, 500);
    }
};

// ➤ 5. Supprimer un produit
export const deleteProduit = async (c: Context) => {
    try {
        const id = c.req.param("id");
        const produit = await Produit.findByIdAndDelete(id);

        if (!produit) return c.json({ error: "Produit introuvable" }, 404);
        return c.json({ message: "Produit supprimé" });
    } catch (error) {
        const err = error as Error;
        return c.json({ error: err.message }, 500);
    }
};

// ➤ 6. Supprimer une variante spécifique
export const deleteVariant = async (c: Context) => {
    try {
        const id = c.req.param("id");
        const { variantId } = await c.req.json();

        if (!variantId) {
            return c.json({ error: "ID de la variante requis" }, 400);
        }

        const produit = await Produit.findById(id);
        if (!produit) return c.json({ error: "Produit introuvable" }, 404);

        // Trouver l'index de la variante
        const variantIndex = produit.variants.findIndex(
            v => v._id && v._id.toString() === variantId
        );

        if (variantIndex === -1) {
            return c.json({ error: "Variante introuvable" }, 404);
        }

        // S'assurer qu'il reste au moins une variante
        if (produit.variants.length <= 1) {
            return c.json({
                error: "Impossible de supprimer la dernière variante du produit"
            }, 400);
        }

        // Supprimer la variante
        produit.variants.splice(variantIndex, 1);
        await produit.save();

        return c.json({
            message: "Variante supprimée avec succès",
            produit
        });
    } catch (error) {
        const err = error as Error;
        return c.json({ error: err.message }, 500);
    }
};

// ➤ 7. APPROVISIONNER une variante spécifique
export const approvisionnerVariant = async (c: Context) => {
    try {
        const id = c.req.param("id");
        const { variantId, quantity } = await c.req.json();

        // Validation
        if (!variantId) {
            return c.json({ error: "ID de la variante requis" }, 400);
        }

        if (!quantity || quantity <= 0) {
            return c.json({ error: "Quantité invalide" }, 400);
        }

        const produit = await Produit.findById(id);
        if (!produit) return c.json({ error: "Produit introuvable" }, 404);

        // Trouver la variante
        const variant = produit.variants.find(
            v => v._id && v._id.toString() === variantId
        );

        if (!variant) {
            return c.json({ error: "Variante introuvable" }, 404);
        }

        // Ajouter la quantité au stock
        variant.stock += quantity;
        await produit.save();

        return c.json({
            message: "Approvisionnement effectué",
            variant: {
                name: variant.name,
                oldStock: variant.stock - quantity,
                newStock: variant.stock,
                quantityAdded: quantity
            },
            produit: {
                id: produit._id,
                name: produit.name
            }
        });
    } catch (error) {
        const err = error as Error;
        return c.json({ error: err.message }, 500);
    }
};