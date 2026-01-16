import type { Context } from "hono";
import { Vente } from "../models/vente.model.js";
import { Produit } from "../models/produit.model.js";

// ➤ Enregistrer une vente complète
export const validerVente = async (c: Context) => {
  console.group("🛒 [BACKEND] validerVente");
  try {
    const body = await c.req.json();
    console.log("➡ Requête reçue :", body);

    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      console.warn("❌ Vente vide ou items invalides");
      return c.json({ error: "La vente doit contenir au moins un article" }, 400);
    }
    if (!body.totalAmount || body.totalAmount <= 0) {
      console.warn("❌ Montant total invalide :", body.totalAmount);
      return c.json({ error: "Montant total invalide" }, 400);
    }

    const ventes = [];
    const errors = [];

    for (const item of body.items) {
      console.log("🔹 Traitement item :", item);

      try {
        if (!item.productId || !item.variantId || !item.quantity || !item.price) {
          errors.push(`Item incomplet: ${item.variantName || 'Inconnu'}`);
          console.warn("❌ Item incomplet :", item);
          continue;
        }

        const produit = await Produit.findById(item.productId);
        if (!produit) {
          errors.push(`Produit introuvable: ${item.productName || item.productId}`);
          console.warn("❌ Produit introuvable :", item.productId);
          continue;
        }

        const variant = produit.variants.find(v => v._id?.toString() === item.variantId);
        if (!variant) {
          errors.push(`Variante introuvable: ${item.variantName || item.variantId}`);
          console.warn("❌ Variante introuvable :", item.variantId);
          continue;
        }

        if (variant.stock < item.quantity) {
          errors.push(`Stock insuffisant pour ${item.variantName}: ${variant.stock} disponible, ${item.quantity} demandé`);
          console.warn("❌ Stock insuffisant :", { variantId: variant._id, available: variant.stock, requested: item.quantity });
          continue;
        }

        const oldStock = variant.stock;
        variant.stock -= item.quantity;
        await produit.save();

        const itemTotal = item.price * item.quantity;
        ventes.push({ ...item, total: itemTotal });

        console.log("✅ Item vendu :", { variantId: variant._id, oldStock, newStock: variant.stock, quantitySold: item.quantity });

      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`Erreur avec ${item.variantName || 'un item'}: ${msg}`);
        console.error("🔥 Erreur item :", msg);
      }
    }

    if (ventes.length === 0 && errors.length > 0) {
      console.warn("❌ Toutes les ventes ont échoué :", errors);
      return c.json({ error: "Échec de la vente", details: errors }, 400);
    }

    const nouvelleVente = await Vente.create({
      items: ventes,
      totalAmount: ventes.reduce((sum, item) => sum + item.total, 0),
      date: body.date ? new Date(body.date) : new Date()
    });

    let message = "Vente validée avec succès";
    if (errors.length > 0) message = `Vente partiellement validée. ${errors.length} erreur(s)`;

    console.log("🎉 Vente globale terminée :", { ventesCount: ventes.length, errors });

    return c.json({
      success: true,
      message,
      data: {
        vente: nouvelleVente,
        itemsVendus: ventes.length,
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

// ➤ Récupérer l'historique des ventes
export const getHistoriqueVentes = async (c: Context) => {
    try {
        const { limit = 50, page = 1, dateFrom, dateTo } = c.req.query();

        const query: any = {};

        // Filtrer par date si fourni
        if (dateFrom || dateTo) {
            query.date = {};
            if (dateFrom) {
                query.date.$gte = new Date(dateFrom as string);
            }
            if (dateTo) {
                query.date.$lte = new Date(dateTo as string);
            }
        }

        const limitNum = parseInt(limit as string);
        const pageNum = parseInt(page as string);
        const skip = (pageNum - 1) * limitNum;

        const [ventes, total] = await Promise.all([
            Vente.find(query)
                .sort({ date: -1 })
                .skip(skip)
                .limit(limitNum),
            Vente.countDocuments(query)
        ]);

        // Calculer les statistiques
        const totalMontant = await Vente.aggregate([
            { $match: query },
            { $group: { _id: null, total: { $sum: "$totalAmount" } } }
        ]);

        const totalArticles = await Vente.aggregate([
            { $match: query },
            { $unwind: "$items" },
            { $group: { _id: null, total: { $sum: "$items.quantity" } } }
        ]);

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
                    totalMontant: totalMontant[0]?.total || 0,
                    totalArticles: totalArticles[0]?.total || 0,
                    nombreVentes: total
                }
            }
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

// ➤ Récupérer les statistiques de vente
export const getStatistiquesVentes = async (c: Context) => {
    try {
        const { periode = "jour" } = c.req.query();

        let groupFormat: any;
        const maintenant = new Date();

        // Définir la période en fonction du paramètre
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
                groupFormat = {
                    year: { $year: "$date" }
                };
                break;
            default:
                groupFormat = {
                    year: { $year: "$date" },
                    month: { $month: "$date" },
                    day: { $dayOfMonth: "$date" }
                };
        }

        // Agrégation pour les statistiques
        const stats = await Vente.aggregate([
            {
                $group: {
                    _id: groupFormat,
                    totalVentes: { $sum: 1 },
                    montantTotal: { $sum: "$totalAmount" },
                    articlesVendus: { $sum: { $sum: "$items.quantity" } },
                    moyennePanier: { $avg: "$totalAmount" },
                    ventes: { $push: "$$ROOT" }
                }
            },
            { $sort: { "_id.year": -1, "_id.month": -1, "_id.day": -1 } }
        ]);

        // Statistiques globales
        const globalStats = await Vente.aggregate([
            {
                $group: {
                    _id: null,
                    totalVentes: { $sum: 1 },
                    montantTotal: { $sum: "$totalAmount" },
                    articlesVendus: { $sum: { $sum: "$items.quantity" } },
                    moyennePanier: { $avg: "$totalAmount" }
                }
            }
        ]);

        // Produits les plus vendus
        const topProduits = await Vente.aggregate([
            { $unwind: "$items" },
            {
                $group: {
                    _id: {
                        productId: "$items.productId",
                        variantName: "$items.variantName"
                    },
                    productName: { $first: "$items.productName" },
                    quantiteVendue: { $sum: "$items.quantity" },
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
                statistiques: stats,
                global: globalStats[0] || {},
                topProduits
            }
        });
    } catch (error) {
        const err = error as Error;
        return c.json({ error: err.message }, 500);
    }
};


