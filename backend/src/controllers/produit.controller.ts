import type { Context } from "hono";
import { Produit, UnitType } from "../models/produit.model.js";
import { Vente } from "../models/vente.model.js";
import mongoose from "mongoose";
import type { AppEnv } from "../types/app.type.js";

// ─── Helpers ────────────────────────────────────────────────────────────────
const convertUnit = (quantity: number, fromUnit: string, toUnit: string): number => {
    if (fromUnit === toUnit) return quantity;
    const liquidToLiter: Record<string, number> = { kL: 1000, L: 1, cL: 0.01, mL: 0.001 };
    const weightToKg: Record<string, number> = { t: 1000, kg: 1, g: 0.001, mg: 0.000001 };
    if (liquidToLiter[fromUnit] && liquidToLiter[toUnit])
        return (quantity * liquidToLiter[fromUnit]) / liquidToLiter[toUnit];
    if (weightToKg[fromUnit] && weightToKg[toUnit])
        return (quantity * weightToKg[fromUnit]) / weightToKg[toUnit];
    return quantity;
};

const calculatePrice = (basePrice: number, baseUnit: string, soldUnit: string, quantity: number): number =>
    basePrice * convertUnit(quantity, soldUnit, baseUnit);

// ─── Créer un produit ────────────────────────────────────────────────────────
export const createProduit = async (c: Context<AppEnv>) => {
    try {
        const tenantId = c.get("tenantId");
        const body = await c.req.json();

        if (!body.boutique_id) return c.json({ error: "boutique_id requis" }, 400);
        if (!body.unit || !Object.values(UnitType).includes(body.unit))
            return c.json({ error: "Unité invalide" }, 400);
        if (body.basePrice == null || body.basePrice < 0)
            return c.json({ error: "Prix de base invalide" }, 400);

        const produit = await Produit.create({ ...body, tenant_id: tenantId });
        return c.json({ message: "Produit créé", produit }, 201);
    } catch (error) {
        return c.json({ error: (error as Error).message }, 500);
    }
};

// ─── Liste des produits (isolée par tenant) ──────────────────────────────────
export const getAllProduits = async (c: Context<AppEnv>) => {
    try {
        const tenantId = c.get("tenantId");
        const { page = "1", limit = "50", boutique_id, search } = c.req.query();
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.min(200, Math.max(1, parseInt(limit)));
        const skip = (pageNum - 1) * limitNum;

        const filter: Record<string, unknown> = { tenant_id: tenantId };
        if (boutique_id) filter.boutique_id = boutique_id;
        if (search?.trim()) {
            filter.$or = [
                { name: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } },
                { category: { $regex: search, $options: "i" } },
            ];
        }

        const [produits, total] = await Promise.all([
            Produit.find(filter).populate("boutique_id", "name address").lean().skip(skip).limit(limitNum).sort({ name: 1 }),
            Produit.countDocuments(filter),
        ]);

        return c.json({
            produits,
            pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
        });
    } catch (error) {
        return c.json({ error: (error as Error).message }, 500);
    }
};

// ─── Récupérer un produit ────────────────────────────────────────────────────
export const getProduit = async (c: Context<AppEnv>) => {
    try {
        const tenantId = c.get("tenantId");
        const id = c.req.param("id");
        const produit = await Produit.findOne({ _id: id, tenant_id: tenantId })
            .populate("boutique_id", "name address")
            .lean();
        if (!produit) return c.json({ error: "Produit introuvable" }, 404);
        return c.json(produit);
    } catch (error) {
        return c.json({ error: (error as Error).message }, 500);
    }
};

// ─── Mettre à jour un produit ────────────────────────────────────────────────
export const updateProduit = async (c: Context<AppEnv>) => {
    try {
        const tenantId = c.get("tenantId");
        const id = c.req.param("id");
        const body = await c.req.json();

        const updateFields: Record<string, unknown> = {};
        if (body.name !== undefined) updateFields.name = body.name;
        if (body.description !== undefined) updateFields.description = body.description;
        if (body.category !== undefined) updateFields.category = body.category;
        if (body.stock !== undefined && body.stock >= 0) updateFields.stock = body.stock;
        if (body.unit !== undefined && Object.values(UnitType).includes(body.unit)) updateFields.unit = body.unit;
        if (body.basePrice !== undefined && body.basePrice >= 0) updateFields.basePrice = body.basePrice;
        if (body.metadata !== undefined) updateFields.metadata = body.metadata;

        const produit = await Produit.findOneAndUpdate(
            { _id: id, tenant_id: tenantId },
            { $set: updateFields },
            { new: true, runValidators: true }
        ).lean();

        if (!produit) return c.json({ error: "Produit introuvable" }, 404);
        return c.json({ message: "Produit mis à jour", produit });
    } catch (error) {
        return c.json({ error: (error as Error).message }, 500);
    }
};

// ─── Supprimer un produit ────────────────────────────────────────────────────
export const deleteProduit = async (c: Context<AppEnv>) => {
    try {
        const tenantId = c.get("tenantId");
        const id = c.req.param("id");
        const produit = await Produit.findOneAndDelete({ _id: id, tenant_id: tenantId }).lean();
        if (!produit) return c.json({ error: "Produit introuvable" }, 404);
        return c.json({ message: "Produit supprimé" });
    } catch (error) {
        return c.json({ error: (error as Error).message }, 500);
    }
};

// ─── Approvisionner ──────────────────────────────────────────────────────────
export const approvisionnerProduit = async (c: Context<AppEnv>) => {
    try {
        const tenantId = c.get("tenantId");
        const id = c.req.param("id");
        const { quantity, unit } = await c.req.json();

        if (!quantity || quantity <= 0) return c.json({ error: "Quantité invalide" }, 400);

        const produit = await Produit.findOne({ _id: id, tenant_id: tenantId });
        if (!produit) return c.json({ error: "Produit introuvable" }, 404);

        const toAdd = unit && unit !== produit.unit ? convertUnit(quantity, unit, produit.unit) : quantity;

        const updated = await Produit.findByIdAndUpdate(id, { $inc: { stock: toAdd } }, { new: true }).lean();

        return c.json({
            success: true,
            message: "Approvisionnement effectué",
            produit: {
                id: updated!._id,
                name: updated!.name,
                unit: updated!.unit,
                oldStock: updated!.stock - toAdd,
                newStock: updated!.stock,
                quantityAdded: toAdd,
            },
        });
    } catch (error) {
        return c.json({ error: (error as Error).message }, 500);
    }
};

// ─── Transfert inter-boutiques ───────────────────────────────────────────────
export const transfertStockBoutiques = async (c: Context<AppEnv>) => {
    try {
        const tenantId = c.get("tenantId");
        const { produitId, boutiqueSrcId, boutiqueDestId, quantity, unit } = await c.req.json();

        if (!produitId || !boutiqueSrcId || !boutiqueDestId || !quantity || quantity <= 0)
            return c.json({ error: "Données invalides" }, 400);

        if (boutiqueSrcId === boutiqueDestId)
            return c.json({ error: "Source et destination identiques" }, 400);

        // 1. Récupérer le produit de RÉFÉRENCE (celui connu du frontend,
        //    peut être dans n'importe quelle boutique du tenant)
        const produitRef = await Produit.findOne({ _id: produitId, tenant_id: tenantId });
        if (!produitRef)
            return c.json({ error: "Produit introuvable" }, 404);

        // 2. Chercher ce produit (par nom) dans la boutique SOURCE
        const produitSrc = await Produit.findOne({
            name: produitRef.name,
            boutique_id: boutiqueSrcId,
            tenant_id: tenantId,
        });
        if (!produitSrc)
            return c.json({
                error: `Le produit "${produitRef.name}" n'existe pas dans la boutique source`,
            }, 404);

        // 3. Convertir la quantité dans l'unité de base du produit source
        const toTransfer = unit && unit !== produitSrc.unit
            ? convertUnit(quantity, unit, produitSrc.unit)
            : quantity;

        if (produitSrc.stock < toTransfer)
            return c.json({
                error: `Stock insuffisant: ${produitSrc.stock} ${produitSrc.unit} disponible en source`,
            }, 400);

        // 4. Chercher ce produit dans la boutique DESTINATION (par nom)
        const produitDest = await Produit.findOne({
            name: produitRef.name,
            boutique_id: boutiqueDestId,
            tenant_id: tenantId,
        });

        // 5. Créer le produit en destination s'il n'existe pas encore
        let destId = produitDest?._id;
        if (!produitDest) {
            const created = await Produit.create({
                name: produitSrc.name,
                description: produitSrc.description,
                category: produitSrc.category,
                unit: produitSrc.unit,
                basePrice: produitSrc.basePrice,
                stock: 0,
                tenant_id: tenantId,
                boutique_id: boutiqueDestId,
            });
            destId = created._id;
        }

        // 6. Appliquer le transfert
        const [srcUpdated, destUpdated] = await Promise.all([
            Produit.findByIdAndUpdate(produitSrc._id, { $inc: { stock: -toTransfer } }, { new: true }).lean(),
            Produit.findByIdAndUpdate(destId, { $inc: { stock: toTransfer } }, { new: true }).lean(),
        ]);

        return c.json({
            success: true,
            message: `${toTransfer} ${produitSrc.unit} de "${produitSrc.name}" transféré(s) avec succès`,
            source:      { boutique_id: boutiqueSrcId,  newStock: srcUpdated!.stock },
            destination: { boutique_id: boutiqueDestId, newStock: destUpdated!.stock },
        });

    } catch (error) {
        return c.json({ error: (error as Error).message }, 500);
    }
};

// ─── Vendre un produit ───────────────────────────────────────────────────────
export const vendreProduit = async (c: Context<AppEnv>) => {
    try {
        const tenantId = c.get("tenantId");
        const id = c.req.param("id");
        const { quantity, unit, customPrice } = await c.req.json();

        if (!quantity || quantity <= 0) return c.json({ error: "Quantité invalide" }, 400);

        const produit = await Produit.findOne({ _id: id, tenant_id: tenantId });
        if (!produit) return c.json({ error: "Produit introuvable" }, 404);

        const unitSold = unit || produit.unit;
        const quantityDeducted = convertUnit(quantity, unitSold, produit.unit);

        if (produit.stock < quantityDeducted)
            return c.json({ error: `Stock insuffisant: ${produit.stock} ${produit.unit}` }, 400);

        let totalPrice: number;
        let unitPrice: number;

        if (customPrice !== undefined && customPrice >= 0) {
            totalPrice = customPrice;
            unitPrice = customPrice / quantity;
        } else {
            totalPrice = calculatePrice(produit.basePrice, produit.unit, unitSold, quantity);
            unitPrice = totalPrice / quantity;
        }

        const oldStock = produit.stock;

        const [updatedProduit, nouvelleVente] = await Promise.all([
            Produit.findByIdAndUpdate(id, { $inc: { stock: -quantityDeducted } }, { new: true }).lean(),
            Vente.create({
                tenant_id: tenantId,
                boutique_id: produit.boutique_id,
                items: [{ productId: produit._id, productName: produit.name, quantitySold: quantity, unitSold, quantityDeducted, unitBase: produit.unit, unitPrice, total: totalPrice }],
                totalAmount: totalPrice,
                date: new Date(),
            }),
        ]);

        return c.json({
            success: true,
            message: "Vente effectuée",
            data: {
                vente: { id: nouvelleVente._id, totalAmount: totalPrice },
                produit: { id: updatedProduit!._id, name: updatedProduit!.name, oldStock, newStock: updatedProduit!.stock },
            },
        });
    } catch (error) {
        return c.json({ error: (error as Error).message }, 500);
    }
};

// ─── Alertes stock ───────────────────────────────────────────────────────────
export const getAlertesStock = async (c: Context<AppEnv>) => {
    try {
        const tenantId = c.get("tenantId");
        const { seuil = "10", boutique_id } = c.req.query();

        const query: Record<string, unknown> = { tenant_id: tenantId, stock: { $lte: parseInt(seuil) } };
        if (boutique_id) query.boutique_id = boutique_id;

        const alertes = await Produit.find(query).select("_id name stock unit boutique_id").lean();

        return c.json({ success: true, data: alertes });
    } catch (error) {
        return c.json({ error: (error as Error).message }, 500);
    }
};