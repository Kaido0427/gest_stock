import type { Context } from "hono";
import { Produit } from "../models/produit.model.js";

// ➤ Ajouter un produit
export const createProduit = async (c: Context) => {
    try {
        const body = await c.req.json();
        const produit = await Produit.create(body);

        return c.json({ message: "Produit créé avec succès", produit }, 201);
    } catch (error) {
        const err = error as Error;
        return c.json({ error: err.message }, 500);
    }
};

// ➤ Voir un produit par ID
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

// ➤ Voir tous les produits
export const getAllProduits = async (c: Context) => {
    try {
        const produits = await Produit.find();
        return c.json(produits);
    } catch (error) {
        const err = error as Error;
        return c.json({ error: err.message }, 500);
    }
};
export const updateProduit = async (c: Context) => {
    try {
        const id = c.req.param("id");
        const body = await c.req.json();

        const produit = await Produit.findById(id);
        if (!produit) return c.json({ error: "Produit introuvable" }, 404);

        // 🚫 --- Blocage total de modification du stock --- 🚫
        const forbiddenStockFields = ["stock", "stockBase", "quantityStock", "stockTotal"];

        for (const field of forbiddenStockFields) {
            if (body[field] !== undefined) {
                return c.json({
                    error: `Le champ "${field}" ne peut pas être modifié directement. Utilisez l'approvisionnement.`
                }, 400);
            }
        }

        // ---- Mise à jour simple des champs ----
        const simpleFields = ["name", "description", "baseUnit"];
        simpleFields.forEach((f) => {
            if (body[f] !== undefined) {
                (produit as any)[f] = body[f];
            }
        });

        // ---- Mise à jour flexible des unités ----
        if (Array.isArray(body.units)) {
            body.units.forEach((unit: any) => {
                const existing = produit.units.find(u => u.name === unit.name);

                if (existing) {
                    existing.quantityPerUnit = unit.quantityPerUnit ?? existing.quantityPerUnit;
                    existing.price = unit.price ?? existing.price;
                } else {
                    produit.units.push(unit);
                }
            });
        }

        // ---- Mise à jour flexible des lots ----
        if (Array.isArray(body.lots)) {
            body.lots.forEach((lot: any) => {
                const existing = produit.lots.find(l => l.name === lot.name);

                if (existing) {
                    existing.quantity = lot.quantity ?? existing.quantity;  // ⚠️ ceci modifie la quantité du lot mais PAS le stock directement
                    existing.expirationDate = lot.expirationDate
                        ? new Date(lot.expirationDate)
                        : existing.expirationDate;
                } else {
                    produit.lots.push({
                        name: lot.name || `LOT-${Date.now()}`,
                        quantity: lot.quantity,
                        expirationDate: lot.expirationDate ? new Date(lot.expirationDate) : undefined
                    });
                }
            });
        }

        // ---- Recalcul automatique du stock basé sur les lots ----
        if (Array.isArray(body.lots)) {
            produit.stockBase = produit.lots.reduce((sum, l) => sum + l.quantity, 0);
        }

        await produit.save();

        return c.json({
            message: "Produit mis à jour avec flexibilité",
            produit
        });

    } catch (error) {
        const err = error as Error;
        return c.json({ error: err.message }, 500);
    }
};


// ➤ Supprimer un produit
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

// ➤ Approvisionner un produit : ajouter stock + lot
export const approvisionnerProduit = async (c: Context) => {
    try {
        const id = c.req.param("id");
        const { quantity, name, expirationDate } = await c.req.json();

        if (!quantity || quantity <= 0)
            return c.json({ error: "Quantité invalide" }, 400);

        const produit = await Produit.findById(id);
        if (!produit) return c.json({ error: "Produit introuvable" }, 404);

        const lot = {
            name: name || `Lot-${Date.now()}`,
            quantity,
            expirationDate: expirationDate ? new Date(expirationDate) : undefined
        };

        produit.lots.push(lot);
        produit.stockBase += quantity;
        await produit.save();

        return c.json({ message: "Approvisionnement effectué", produit });
    } catch (error) {
        const err = error as Error;
        return c.json({ error: err.message }, 500);
    }
};
