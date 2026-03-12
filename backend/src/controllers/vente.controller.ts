import type { Context } from "hono";
import { Vente } from "../models/vente.model";
import { Produit } from "../models/produit.model";
import mongoose from "mongoose";
import type { AppEnv } from "../types/app.type";

const convertUnit = (quantity: number, fromUnit: string, toUnit: string): number => {
    if (!fromUnit || !toUnit || fromUnit === toUnit) return quantity;
    const f = fromUnit.trim().toLowerCase();
    const t = toUnit.trim().toLowerCase();
    const liq: Record<string, number> = { kl: 1000, l: 1, cl: 0.01, ml: 0.001 };
    const wgt: Record<string, number> = { t: 1000, kg: 1, g: 0.001, mg: 0.000001 };
    if (liq[f] !== undefined && liq[t] !== undefined) return (quantity * liq[f]) / liq[t];
    if (wgt[f] !== undefined && wgt[t] !== undefined) return (quantity * wgt[f]) / wgt[t];
    return quantity;
};

const calculatePrice = (basePrice: number, baseUnit: string, soldUnit: string, soldQty: number): number => {
    return basePrice * convertUnit(1, soldUnit, baseUnit) * soldQty;
};

// ─── Valider une vente (panier) ──────────────────────────────────────────────
export const validerVente = async (c: Context<AppEnv>) => {
    try {
        const tenantId = c.get("tenantId");
        const body = await c.req.json();

        if (!body.items || !Array.isArray(body.items) || body.items.length === 0)
            return c.json({ error: "La vente doit contenir au moins un article" }, 400);

        const ventesItems = [];
        const errors: string[] = [];
        let totalAmount = 0;
        let boutique_id: mongoose.Types.ObjectId | null = null;

        for (const item of body.items) {
            if (!item.productId || !item.quantity || item.quantity <= 0) {
                errors.push(`Item incomplet: ${item.productName || "Inconnu"}`);
                continue;
            }

            const produit = await Produit.findOne({ _id: item.productId, tenant_id: tenantId });
            if (!produit) {
                errors.push(`Produit introuvable: ${item.productName || item.productId}`);
                continue;
            }

            if (!boutique_id) boutique_id = produit.boutique_id;

            const unitSold = item.unit || produit.unit;
            const quantityDeducted = convertUnit(item.quantity, unitSold, produit.unit);

            if (produit.stock < quantityDeducted) {
                errors.push(`Stock insuffisant pour ${produit.name}: ${produit.stock} ${produit.unit} dispo`);
                continue;
            }

            let itemTotal: number;
            let unitPrice: number;

            if (item.customPrice !== undefined && item.customPrice >= 0) {
                itemTotal = item.customPrice;
                unitPrice = item.customPrice / item.quantity;
            } else if (item.price !== undefined && item.price >= 0) {
                unitPrice = item.price;
                itemTotal = item.price * item.quantity;
            } else {
                itemTotal = calculatePrice(produit.basePrice, produit.unit, unitSold, item.quantity);
                unitPrice = itemTotal / item.quantity;
            }

            await Produit.findByIdAndUpdate(produit._id, { $inc: { stock: -quantityDeducted } });

            ventesItems.push({
                productId: produit._id,
                productName: produit.name,
                quantitySold: item.quantity,
                unitSold,
                quantityDeducted,
                unitBase: produit.unit,
                unitPrice,
                total: itemTotal,
            });

            totalAmount += itemTotal;
        }

        if (ventesItems.length === 0 && errors.length > 0)
            return c.json({ error: "Échec de la vente", details: errors }, 400);

        const nouvelleVente = await Vente.create({
            tenant_id: tenantId,
            boutique_id: boutique_id ?? body.boutique_id,
            items: ventesItems,
            totalAmount,
            date: body.date ? new Date(body.date) : new Date(),
        });

        return c.json(
            {
                success: true,
                message: errors.length > 0 ? `Vente partiellement validée. ${errors.length} erreur(s)` : "Vente validée",
                data: {
                    vente: nouvelleVente,
                    itemsVendus: ventesItems.length,
                    montantTotal: nouvelleVente.totalAmount,
                    erreurs: errors.length > 0 ? errors : undefined,
                },
            },
            201
        );
    } catch (error) {
        return c.json({ error: (error as Error).message }, 500);
    }
};

// ─── Historique des ventes ───────────────────────────────────────────────────
export const getHistoriqueVentes = async (c: Context<AppEnv>) => {
    try {
        const tenantId = c.get("tenantId");
        const plan = c.get("plan");
        const { limit = "50", page = "1", dateFrom, dateTo, boutique_id } = c.req.query();

        const query: Record<string, unknown> = { tenant_id: tenantId };
        if (boutique_id) query.boutique_id = boutique_id;

        // Limiter l'historique selon le plan
        const { PLAN_LIMITS } = await import("../utils/plan.limits.js");
        const joursMax = PLAN_LIMITS[plan].historiqueJours;
        if (joursMax !== -1) {
            const dateMin = new Date();
            dateMin.setDate(dateMin.getDate() - joursMax);
            query.date = { $gte: dateMin };
        }

        if (dateFrom || dateTo) {
            const dateFilter = (query.date as Record<string, Date>) || {};
            if (dateFrom) dateFilter.$gte = new Date(dateFrom);
            if (dateTo) dateFilter.$lte = new Date(dateTo);
            query.date = dateFilter;
        }

        const limitNum = parseInt(limit);
        const pageNum = parseInt(page);
        const skip = (pageNum - 1) * limitNum;

        const [ventes, total] = await Promise.all([
            Vente.find(query).sort({ date: -1 }).skip(skip).limit(limitNum).lean(),
            Vente.countDocuments(query),
        ]);

        const totalMontant = ventes.reduce((sum, v) => sum + v.totalAmount, 0);

        return c.json({
            success: true,
            data: {
                ventes,
                pagination: { total, page: pageNum, limit: limitNum, pages: Math.ceil(total / limitNum) },
                statistiques: { totalMontant, nombreVentes: total },
            },
        });
    } catch (error) {
        return c.json({ error: (error as Error).message }, 500);
    }
};

// ─── Stats ventes (Business+) ────────────────────────────────────────────────
export const getStatistiquesVentes = async (c: Context<AppEnv>) => {
    try {
        const tenantId = c.get("tenantId");
        const { periode = "jour", boutique_id } = c.req.query();

        const matchStage: Record<string, unknown> = {
            tenant_id: new mongoose.Types.ObjectId(tenantId),
        };
        if (boutique_id) matchStage.boutique_id = new mongoose.Types.ObjectId(boutique_id);

        const now = new Date();
        if (periode === "jour") {
            matchStage.date = {
                $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
                $lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1),
            };
        } else if (periode === "mois") {
            matchStage.date = {
                $gte: new Date(now.getFullYear(), now.getMonth(), 1),
                $lt: new Date(now.getFullYear(), now.getMonth() + 1, 1),
            };
        }

        const [globalStats, topProduits] = await Promise.all([
            Vente.aggregate([
                { $match: matchStage },
                { $group: { _id: null, totalVentes: { $sum: 1 }, montantTotal: { $sum: "$totalAmount" }, moyennePanier: { $avg: "$totalAmount" } } },
            ]),
            Vente.aggregate([
                { $match: matchStage },
                { $unwind: "$items" },
                { $group: { _id: "$items.productId", productName: { $first: "$items.productName" }, quantiteVendue: { $sum: "$items.quantitySold" }, totalRevenu: { $sum: "$items.total" } } },
                { $sort: { quantiteVendue: -1 } },
                { $limit: 10 },
            ]),
        ]);

        return c.json({
            success: true,
            data: {
                global: globalStats[0] || { totalVentes: 0, montantTotal: 0, moyennePanier: 0 },
                topProduits,
            },
        });
    } catch (error) {
        return c.json({ error: (error as Error).message }, 500);
    }
};

// ─── Récupérer une vente ─────────────────────────────────────────────────────
export const getVenteById = async (c: Context<AppEnv>) => {
    try {
        const tenantId = c.get("tenantId");
        const id = c.req.param("id");
        const vente = await Vente.findOne({ _id: id, tenant_id: tenantId }).lean();
        if (!vente) return c.json({ error: "Vente introuvable" }, 404);
        return c.json({ success: true, data: vente });
    } catch (error) {
        return c.json({ error: (error as Error).message }, 500);
    }
};