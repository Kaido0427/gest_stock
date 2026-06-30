// backend/src/controllers/vente.controller.ts
import type { Context } from "hono";
import { Vente } from "../models/vente.model.js";
import { Produit } from "../models/produit.model.js";
import { Boutique } from "../models/boutique.model.js";
import type { Types } from "mongoose";
import mongoose from "mongoose";

// ✅ Helper function pour les conversions d'unités (même que dans produit.controller)
const convertUnit = (quantity: number, fromUnit: string, toUnit: string): number => {
    if (!fromUnit || !toUnit) return quantity;
    const from = fromUnit.trim().toLowerCase();
    const to = toUnit.trim().toLowerCase();

    if (from === to) return quantity;

    const liquidToLiter: { [key: string]: number } = {
        'kl': 1000,
        'l': 1,
        'cl': 0.01,
        'ml': 0.001
    };

    const weightToKg: { [key: string]: number } = {
        't': 1000,
        'kg': 1,
        'g': 0.001,
        'mg': 0.000001
    };

    if (liquidToLiter[from] !== undefined && liquidToLiter[to] !== undefined) {
        const inLiters = quantity * liquidToLiter[from];
        return inLiters / liquidToLiter[to];
    }

    if (weightToKg[from] !== undefined && weightToKg[to] !== undefined) {
        const inKg = quantity * weightToKg[from];
        return inKg / weightToKg[to];
    }

    return quantity;
};

// ✅ Helper pour calculer le prix
const calculatePrice = (basePrice: number, baseUnit: string, soldUnit: string, soldQuantity: number): number => {
    const unitInBase = convertUnit(1, soldUnit, baseUnit);
    const pricePerSoldUnit = basePrice * unitInBase;
    return pricePerSoldUnit * soldQuantity;
};

// ➤ Enregistrer une vente complète (panier avec plusieurs produits)
export const validerVente = async (c: Context) => {
    console.group("🛒 [BACKEND] validerVente");
    try {
        const body = await c.req.json();
        console.log("➡ Requête reçue :", body);

        if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
            console.warn("❌ Vente vide ou items invalides");
            return c.json({ error: "La vente doit contenir au moins un article" }, 400);
        }

        const ventesItems = [];
        const errors = [];
        let totalAmount = 0;
        let boutique_id: Types.ObjectId | null = null;

        // ─── Phase 1 : validation et lecture (sans toucher au stock) ──────────
        const resolvedItems: Array<{
            produit: any;
            unitSold: string;
            quantityDeducted: number;
            itemTotal: number;
            unitPrice: number;
            item: any;
        }> = [];

        for (const item of body.items) {
            if (!item.productId || !item.quantity || item.quantity <= 0) {
                errors.push(`Item incomplet: ${item.productName || 'Inconnu'}`);
                continue;
            }

            const produit = await Produit.findById(item.productId).lean();
            if (!produit) {
                errors.push(`Produit introuvable: ${item.productName || item.productId}`);
                continue;
            }

            if (!boutique_id) boutique_id = produit.boutique_id;

            const unitSold = item.unit || produit.unit;
            let quantityDeducted: number;
            try {
                quantityDeducted = convertUnit(item.quantity, unitSold, produit.unit);
            } catch {
                errors.push(`Unités incompatibles pour ${produit.name}: "${unitSold}" → "${produit.unit}"`);
                continue;
            }

            if (produit.stock < quantityDeducted) {
                errors.push(`Stock insuffisant pour ${produit.name}: ${produit.stock} ${produit.unit} disponible, ${quantityDeducted} ${produit.unit} demandé`);
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

            resolvedItems.push({ produit, unitSold, quantityDeducted, itemTotal, unitPrice, item });
        }

        if (resolvedItems.length === 0) {
            return c.json({ error: "Échec de la vente", details: errors }, 400);
        }

        // ─── Phase 2 : déduction atomique du stock ────────────────────────────
        //    findOneAndUpdate avec filtre stock >= qty → impossible d'aller en négatif
        //    On garde une trace pour compensation si l'enregistrement de la vente échoue.
        const deducted: Array<{ id: any; qty: number }> = [];
        for (const r of resolvedItems) {
            const updated = await Produit.findOneAndUpdate(
                { _id: r.produit._id, stock: { $gte: r.quantityDeducted } },
                { $inc: { stock: -r.quantityDeducted } },
                { new: true }
            );
            if (!updated) {
                // Stock est passé entre-temps (vente concurrente) → on ignore cet item
                errors.push(`Stock épuisé en temps réel pour ${r.produit.name}`);
                continue;
            }
            deducted.push({ id: r.produit._id, qty: r.quantityDeducted });
            ventesItems.push({
                productId: r.produit._id,
                productName: r.produit.name,
                quantitySold: r.item.quantity,
                unitSold: r.unitSold,
                quantityDeducted: r.quantityDeducted,
                unitBase: r.produit.unit,
                unitPrice: r.unitPrice,
                total: r.itemTotal,
            });
            totalAmount += r.itemTotal;
        }

        if (ventesItems.length === 0) {
            return c.json({ error: "Échec de la vente", details: errors }, 400);
        }

        // ─── Phase 3 : enregistrement de la vente ────────────────────────────
        //    Si ça échoue ici, on recrédite tous les stocks déduits (compensation).
        let nouvelleVente;
        try {
            nouvelleVente = await Vente.create({
                boutique_id: boutique_id,
                items: ventesItems,
                totalAmount: totalAmount,
                date: body.date ? new Date(body.date) : new Date()
            });
        } catch (e) {
            // Compensation : recréditer tout le stock déduit
            await Promise.all(
                deducted.map(d => Produit.findByIdAndUpdate(d.id, { $inc: { stock: d.qty } }))
            );
            throw e;
        }

        let message = "Vente validée avec succès";
        if (errors.length > 0) message = `Vente partiellement validée. ${errors.length} erreur(s)`;

        console.log("🎉 Vente globale terminée :", { ventesCount: ventesItems.length, errors });

        return c.json({
            success: true,
            message,
            data: {
                vente: nouvelleVente,
                itemsVendus: ventesItems.length,
                montantTotal: nouvelleVente.totalAmount,
                erreurs: errors.length > 0 ? errors : undefined
            }
        }, 201);

    } catch (error) {
        const err = error as Error;
        console.error("🔥 Erreur validerVente :", err);
        return c.json({ error: err.message }, 500);
    } finally {
        console.groupEnd();
    }
};

// ➤ Récupérer l'historique des ventes (avec filtre boutique)
export const getHistoriqueVentes = async (c: Context) => {
    try {
        console.log("🔵 getHistoriqueVentes appelé");
        const { limit = 50, page = 1, dateFrom, dateTo, boutique_id } = c.req.query();

        const query: any = {};

        // ✅ Filtre direct par boutique_id dans la vente
        if (boutique_id) {
            query.boutique_id = boutique_id;
        }

        if (dateFrom || dateTo) {
            query.date = {};
            if (dateFrom) query.date.$gte = new Date(dateFrom as string);
            if (dateTo) query.date.$lte = new Date(dateTo as string);
        }

        const limitNum = parseInt(limit as string);
        const pageNum = parseInt(page as string);
        const skip = (pageNum - 1) * limitNum;

        const [ventes, total] = await Promise.all([
            Vente.find(query).sort({ date: -1 }).skip(skip).limit(limitNum),
            Vente.countDocuments(query)
        ]);

        // Calcul des statistiques
        let totalMontant = 0;
        let totalArticles = 0;

        for (const vente of ventes) {
            totalMontant += vente.totalAmount;
            for (const item of vente.items) {
                totalArticles += item.quantitySold;
            }
        }

        return c.json({
            success: true,
            data: {
                ventes,
                pagination: {
                    total,
                    page: pageNum,
                    limit: limitNum,
                    pages: Math.ceil(total / limitNum)
                },
                statistiques: {
                    totalMontant,
                    totalArticles,
                    nombreVentes: total
                }
            }
        });
    } catch (error) {
        console.error("❌ ERREUR:", error);
        return c.json({ error: (error as Error).message }, 500);
    }
};


export const getStatistiquesVentes = async (c: Context) => {
  try {
    const { periode = "jour", boutique_id } = c.req.query();
    let matchStage: any = {};

    // ✅ BON FILTRE BOUTIQUE
    if (boutique_id) {
        
       matchStage.boutique_id = new mongoose.Types.ObjectId(boutique_id);
    }

    const now = new Date();

    if (periode === "jour") {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      matchStage.date = { $gte: start, $lt: end };
    }

    if (periode === "mois") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      matchStage.date = { $gte: start, $lt: end };
    }

    const globalStats = await Vente.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalVentes: { $sum: 1 },
          montantTotal: { $sum: "$totalAmount" },
          moyennePanier: { $avg: "$totalAmount" }
        }
      }
    ]);

    const topProduits = await Vente.aggregate([
      { $match: matchStage },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.productId",
          productName: { $first: "$items.productName" },
          quantiteVendue: { $sum: "$items.quantitySold" }
        }
      }
    ]);

    return c.json({
      success: true,
      data: {
        global: globalStats[0] || {
          totalVentes: 0,
          montantTotal: 0,
          moyennePanier: 0
        },
        topProduits
      }
    });
  } catch (e) {
    console.error(e);
    return c.json({ error: "Erreur stats" }, 500);
  }
};


// ➤ Récupérer toutes les boutiques (pour admin)
export const getBoutiques = async (c: Context) => {
    try {
        const boutiques = await Boutique.find()
            .populate("responsable_id", "name email")
            .sort({ name: 1 });

        return c.json({
            success: true,
            data: boutiques
        });
    } catch (error) {
        const err = error as Error;
        return c.json({ error: err.message }, 500);
    }
};

// ➤ Récupérer une vente spécifique
export const getVenteById = async (c: Context) => {
    try {
        const id = c.req.param("id");
        const vente = await Vente.findById(id);

        if (!vente) return c.json({ error: "Vente introuvable" }, 404);
        return c.json({
            success: true,
            data: vente
        });
    } catch (error) {
        const err = error as Error;
        return c.json({ error: err.message }, 500);
    }
};