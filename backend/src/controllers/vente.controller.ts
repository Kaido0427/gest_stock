// backend/src/controllers/vente.controller.ts
import type { Context } from "hono";
import { Vente } from "../models/vente.model.js";
import { Produit } from "../models/produit.model.js";
import { Boutique } from "../models/boutique.model.js";
import type { Types } from "mongoose";

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

        for (const item of body.items) {
            console.log("🔹 Traitement item :", item);

            try {
                // Validation de base
                if (!item.productId || !item.quantity || item.quantity <= 0) {
                    errors.push(`Item incomplet: ${item.productName || 'Inconnu'}`);
                    console.warn("❌ Item incomplet :", item);
                    continue;
                }

                const produit = await Produit.findById(item.productId);
                if (!produit) {
                    errors.push(`Produit introuvable: ${item.productName || item.productId}`);
                    console.warn("❌ Produit introuvable :", item.productId);
                    continue;
                }

                // Capturer le boutique_id du premier produit
                if (!boutique_id) {
                    boutique_id = produit.boutique_id;
                }

                // ✅ Déterminer l'unité de vente
                const unitSold = item.unit || produit.unit;

                // ✅ Convertir la quantité vendue en unité de base
                const quantityDeducted = convertUnit(item.quantity, unitSold, produit.unit);

                // Vérifier le stock
                if (produit.stock < quantityDeducted) {
                    errors.push(
                        `Stock insuffisant pour ${produit.name}: ${produit.stock} ${produit.unit} disponible, ${quantityDeducted} ${produit.unit} demandé`
                    );
                    console.warn("❌ Stock insuffisant :", {
                        productId: produit._id,
                        available: produit.stock,
                        requested: quantityDeducted
                    });
                    continue;
                }

                // ✅ Calculer le prix (avec possibilité de prix personnalisé)
                let itemTotal: number;
                let unitPrice: number;

                if (item.customPrice !== undefined && item.customPrice >= 0) {
                    itemTotal = item.customPrice;
                    unitPrice = item.customPrice / item.quantity;
                } else if (item.price !== undefined && item.price >= 0) {
                    // Prix unitaire fourni directement
                    unitPrice = item.price;
                    itemTotal = item.price * item.quantity;
                } else {
                    // Calculer selon le prix de base
                    itemTotal = calculatePrice(produit.basePrice, produit.unit, unitSold, item.quantity);
                    unitPrice = itemTotal / item.quantity;
                }

                // ✅ Déduire du stock
                const oldStock = produit.stock;
                produit.stock -= quantityDeducted;
                await produit.save();

                // ✅ Ajouter à la liste des items vendus
                ventesItems.push({
                    productId: produit._id,
                    productName: produit.name,
                    quantitySold: item.quantity,
                    unitSold: unitSold,
                    quantityDeducted: quantityDeducted,
                    unitBase: produit.unit,
                    unitPrice: unitPrice,
                    total: itemTotal
                });

                totalAmount += itemTotal;

                console.log("✅ Item vendu :", {
                    productId: produit._id,
                    oldStock,
                    newStock: produit.stock,
                    quantitySold: item.quantity,
                    unitSold,
                    quantityDeducted
                });

            } catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                errors.push(`Erreur avec ${item.productName || 'un item'}: ${msg}`);
                console.error("🔥 Erreur item :", msg);
            }
        }

        if (ventesItems.length === 0 && errors.length > 0) {
            console.warn("❌ Toutes les ventes ont échoué :", errors);
            return c.json({ error: "Échec de la vente", details: errors }, 400);
        }

        // ✅ Enregistrer la vente globale
        const nouvelleVente = await Vente.create({
            boutique_id: boutique_id,
            items: ventesItems,
            totalAmount: totalAmount,
            date: body.date ? new Date(body.date) : new Date()
        });

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

// ➤ Statistiques des ventes
export const getStatistiquesVentes = async (c: Context) => {
    try {
        const { periode = "jour", boutique_id } = c.req.query();

        let matchStage: any = {};

        // ✅ Filtre direct par boutique_id
        if (boutique_id) {
            matchStage.boutique_id = boutique_id;
        }

        let groupFormat: any;
        switch (periode) {
            case "jour":
                groupFormat = {
                    year: { $year: "$date" },
                    month: { $month: "$date" },
                    day: { $dayOfMonth: "$date" }
                };
                break;
            case "mois":
                groupFormat = {
                    year: { $year: "$date" },
                    month: { $month: "$date" }
                };
                break;
            case "annee":
                groupFormat = { year: { $year: "$date" } };
                break;
            default:
                groupFormat = {
                    year: { $year: "$date" },
                    month: { $month: "$date" },
                    day: { $dayOfMonth: "$date" }
                };
        }

        // Statistiques globales
        const globalStats = await Vente.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: null,
                    totalVentes: { $sum: 1 },
                    montantTotal: { $sum: "$totalAmount" },
                    articlesVendus: {
                        $sum: {
                            $sum: "$items.quantitySold"
                        }
                    },
                    moyennePanier: { $avg: "$totalAmount" }
                }
            }
        ]);

        // Top produits vendus
        const topProduits = await Vente.aggregate([
            { $match: matchStage },
            { $unwind: "$items" },
            {
                $group: {
                    _id: "$items.productId",
                    productName: { $first: "$items.productName" },
                    quantiteVendue: { $sum: "$items.quantitySold" },
                    uniteBase: { $first: "$items.unitBase" },
                    montantTotal: { $sum: "$items.total" }
                }
            },
            { $sort: { quantiteVendue: -1 } },
            { $limit: 10 }
        ]);

        return c.json({
            success: true,
            data: {
                periode,
                global: globalStats[0] || {
                    totalVentes: 0,
                    montantTotal: 0,
                    articlesVendus: 0,
                    moyennePanier: 0
                },
                topProduits
            }
        });
    } catch (error) {
        console.error("❌ Erreur:", error);
        return c.json({ error: (error as Error).message }, 500);
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