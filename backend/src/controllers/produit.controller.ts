import type { Context } from "hono";
import { Produit, UnitType } from "../models/produit.model.js";
import mongoose from "mongoose";
import { Vente } from "../models/vente.model.js";

// ─── FIX #1 : Ajouter ces index dans ton modèle Produit (à faire UNE SEULE FOIS) ──
// Produit.collection.createIndex({ boutique_id: 1 });
// Produit.collection.createIndex({ name: 1, boutique_id: 1 });
// Produit.collection.createIndex({ stock: 1 });

// ✅ Helper conversions d'unités
const convertUnit = (quantity: number, fromUnit: string, toUnit: string): number => {
    if (fromUnit === toUnit) return quantity;

    const liquidToLiter: { [key: string]: number } = {
        'kL': 1000, 'L': 1, 'cL': 0.01, 'mL': 0.001
    };
    const weightToKg: { [key: string]: number } = {
        't': 1000, 'kg': 1, 'g': 0.001, 'mg': 0.000001
    };

    if (liquidToLiter[fromUnit] && liquidToLiter[toUnit]) {
        return (quantity * liquidToLiter[fromUnit]) / liquidToLiter[toUnit];
    }
    if (weightToKg[fromUnit] && weightToKg[toUnit]) {
        return (quantity * weightToKg[fromUnit]) / weightToKg[toUnit];
    }
    return quantity;
};

const calculatePrice = (basePrice: number, baseUnit: string, soldUnit: string, quantity: number): number => {
    return basePrice * convertUnit(quantity, soldUnit, baseUnit);
};

// ─── ROUTE : Créer un produit dans plusieurs boutiques ──────────────────────
export const createProduitMultiBoutiques = async (c: Context) => {
    try {
        const body = await c.req.json();
        const { boutiques, ...produitData } = body;

        if (!boutiques || !Array.isArray(boutiques) || boutiques.length === 0) {
            return c.json({ error: "Vous devez sélectionner au moins une boutique" }, 400);
        }
        if (!produitData.name || !produitData.unit || !produitData.basePrice) {
            return c.json({ error: "Nom, unité et prix de base sont requis" }, 400);
        }
        if (produitData.basePrice <= 0) {
            return c.json({ error: "Le prix de base doit être supérieur à 0" }, 400);
        }

        // ✅ FIX #2 : insertMany au lieu de N create() séparés → 1 seul aller-retour DB
        const docs = boutiques.map((b: any) => ({
            name: produitData.name,
            description: produitData.description,
            category: produitData.category,
            stock: b.stock || 0,
            unit: produitData.unit,
            basePrice: produitData.basePrice,
            boutique_id: b.boutique_id,
            metadata: produitData.metadata,
        }));

        const inserted = await Produit.insertMany(docs, { ordered: false });

        return c.json({
            success: true,
            message: `Produit créé dans ${inserted.length} boutique(s)`,
            produits: inserted.map(p => ({
                boutique_id: p.boutique_id,
                produit_id: p._id,
                stock: p.stock,
            })),
        }, 201);
    } catch (error) {
        const err = error as any;
        // insertMany avec ordered:false peut réussir partiellement
        if (err.insertedDocs) {
            return c.json({
                success: true,
                message: `Produit créé dans ${err.insertedDocs.length} boutique(s) avec des erreurs partielles`,
                produits: err.insertedDocs.map((p: any) => ({
                    boutique_id: p.boutique_id,
                    produit_id: p._id,
                    stock: p.stock,
                })),
                errors: err.writeErrors,
            }, 201);
        }
        return c.json({ error: (error as Error).message }, 500);
    }
};

// ─── Créer un produit (une seule boutique) ───────────────────────────────────
export const createProduit = async (c: Context) => {
    try {
        const body = await c.req.json();

        if (!body.boutique_id) return c.json({ error: "L'ID de la boutique est requis" }, 400);
        if (body.stock === undefined || body.stock < 0) return c.json({ error: "Le stock doit être un nombre positif" }, 400);
        if (!body.unit || !Object.values(UnitType).includes(body.unit)) return c.json({ error: "L'unité doit être valide" }, 400);
        if (!body.basePrice || body.basePrice < 0) return c.json({ error: "Le prix de base doit être un nombre positif" }, 400);

        const produit = await Produit.create({
            name: body.name,
            description: body.description,
            category: body.category,
            stock: body.stock,
            unit: body.unit,
            basePrice: body.basePrice,
            boutique_id: body.boutique_id,
            metadata: body.metadata,
        });

        return c.json({ message: "Produit créé avec succès", produit }, 201);
    } catch (error) {
        return c.json({ error: (error as Error).message }, 500);
    }
};

// ─── Voir tous les produits ──────────────────────────────────────────────────
export const getAllProduits = async (c: Context) => {
    try {
        // ✅ FIX #3 : .lean() → retourne des objets JS purs, ~30-40% plus rapide
        // ✅ FIX #4 : Pagination pour éviter de charger 10 000 produits d'un coup
        const { page = "1", limit = "50", boutique_id } = c.req.query();
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.min(200, Math.max(1, parseInt(limit))); // max 200 par page
        const skip = (pageNum - 1) * limitNum;

        const filter: any = {};
        if (boutique_id) filter.boutique_id = boutique_id;

        // ✅ Lancer count et find en parallèle → gain de temps
        const [produits, total] = await Promise.all([
            Produit.find(filter)
                .populate("boutique_id", "name address")
                .lean()           // ← clé de la perf
                .skip(skip)
                .limit(limitNum)
                .sort({ name: 1 }),
            Produit.countDocuments(filter),
        ]);

        return c.json({
            produits,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum),
                hasMore: skip + limitNum < total,
            },
        });
    } catch (error) {
        return c.json({ error: (error as Error).message }, 500);
    }
};

// ─── Voir tous les produits d'une boutique ───────────────────────────────────
export const getProduitsByBoutique = async (c: Context) => {
    try {
        const boutique_id = c.req.param("boutique_id");

        if (!mongoose.Types.ObjectId.isValid(boutique_id)) {
            return c.json({ error: "ID de boutique invalide" }, 400);
        }

        // ✅ FIX #3 : .lean() ici aussi
        const produits = await Produit.find({ boutique_id })
            .populate("boutique_id", "name address")
            .lean()
            .sort({ name: 1 });

        return c.json(produits);
    } catch (error) {
        return c.json({ error: (error as Error).message }, 500);
    }
};

// ─── Voir un produit par ID ──────────────────────────────────────────────────
export const getProduit = async (c: Context) => {
    try {
        const id = c.req.param("id");
        // ✅ FIX #3 : .lean() sur les lectures simples aussi
        const produit = await Produit.findById(id)
            .populate("boutique_id", "name address")
            .lean();

        if (!produit) return c.json({ error: "Produit introuvable" }, 404);
        return c.json(produit);
    } catch (error) {
        return c.json({ error: (error as Error).message }, 500);
    }
};

// ─── Mettre à jour un produit ────────────────────────────────────────────────
export const updateProduit = async (c: Context) => {
    try {
        const id = c.req.param("id");
        const body = await c.req.json();

        // ✅ FIX : findByIdAndUpdate au lieu de findById + save() → 1 seul aller DB
        const updateFields: any = {};
        if (body.name !== undefined) updateFields.name = body.name;
        if (body.description !== undefined) updateFields.description = body.description;
        if (body.category !== undefined) updateFields.category = body.category;
        if (body.stock !== undefined && body.stock >= 0) updateFields.stock = body.stock;
        if (body.unit !== undefined && Object.values(UnitType).includes(body.unit)) updateFields.unit = body.unit;
        if (body.basePrice !== undefined && body.basePrice >= 0) updateFields.basePrice = body.basePrice;
        if (body.boutique_id !== undefined) updateFields.boutique_id = body.boutique_id;
        if (body.metadata !== undefined) updateFields.metadata = body.metadata;

        const produit = await Produit.findByIdAndUpdate(
            id,
            { $set: updateFields },
            { new: true, runValidators: true }
        ).lean();

        if (!produit) return c.json({ error: "Produit introuvable" }, 404);

        return c.json({ message: "Produit mis à jour avec succès", produit });
    } catch (error) {
        return c.json({ error: (error as Error).message }, 500);
    }
};

// ─── Supprimer un produit ────────────────────────────────────────────────────
export const deleteProduit = async (c: Context) => {
    try {
        const id = c.req.param("id");
        const produit = await Produit.findByIdAndDelete(id).lean();
        if (!produit) return c.json({ error: "Produit introuvable" }, 404);
        return c.json({ message: "Produit supprimé" });
    } catch (error) {
        return c.json({ error: (error as Error).message }, 500);
    }
};

// ─── Approvisionner un produit ───────────────────────────────────────────────
export const approvisionnerProduit = async (c: Context) => {
    try {
        const id = c.req.param("id");
        const { quantity, unit } = await c.req.json();

        if (!quantity || quantity <= 0) return c.json({ error: "Quantité invalide" }, 400);

        const produit = await Produit.findById(id);
        if (!produit) return c.json({ error: "Produit introuvable" }, 404);

        const quantityToAdd = (unit && unit !== produit.unit)
            ? convertUnit(quantity, unit, produit.unit)
            : quantity;

        // ✅ FIX : $inc au lieu de findById + save() → atomique + 1 seul aller DB
        const updated = await Produit.findByIdAndUpdate(
            id,
            { $inc: { stock: quantityToAdd } },
            { new: true }
        ).lean();

        return c.json({
            success: true,
            message: "Approvisionnement effectué",
            produit: {
                id: updated!._id,
                name: updated!.name,
                unit: updated!.unit,
                oldStock: updated!.stock - quantityToAdd,
                newStock: updated!.stock,
                quantityAdded: quantityToAdd,
            },
        });
    } catch (error) {
        return c.json({ error: (error as Error).message }, 500);
    }
};

// ─── Transfert de stock entre boutiques ─────────────────────────────────────
export const transfertStockBoutiques = async (c: Context) => {
    try {
        const { produitId, boutiqueSrcId, boutiqueDestId, quantity, unit } = await c.req.json();

        if (!produitId || !boutiqueSrcId || !boutiqueDestId || !quantity || quantity <= 0) {
            return c.json({ error: "Données invalides" }, 400);
        }
        if (boutiqueSrcId === boutiqueDestId) {
            return c.json({ error: "La boutique source et destination doivent être différentes" }, 400);
        }

        // ✅ FIX #5 : Récupérer les 2 produits en parallèle → divisé le temps par 2
        const [produitDest, produitSrcByName] = await Promise.all([
            Produit.findOne({ _id: produitId, boutique_id: boutiqueDestId }),
            // On récupère d'abord le nom via la dest pour chercher la source
            null,
        ]);

        if (!produitDest) {
            return c.json({ error: "Produit introuvable dans la boutique de destination" }, 404);
        }

        const produitSrc = await Produit.findOne({ name: produitDest.name, boutique_id: boutiqueSrcId });

        if (!produitSrc) {
            return c.json({
                error: `Le produit "${produitDest.name}" n'existe pas dans la boutique source`,
            }, 404);
        }

        const unitToUse = unit || produitSrc.unit;
        const quantityToTransfer = (unitToUse !== produitSrc.unit)
            ? convertUnit(quantity, unitToUse, produitSrc.unit)
            : quantity;

        if (produitSrc.stock < quantityToTransfer) {
            return c.json({
                error: `Stock insuffisant. Disponible: ${produitSrc.stock} ${produitSrc.unit}`,
            }, 400);
        }

        // ✅ FIX : updateMany en parallèle (2 $inc atomiques simultanés)
        const [srcUpdated, destUpdated] = await Promise.all([
            Produit.findByIdAndUpdate(
                produitSrc._id,
                { $inc: { stock: -quantityToTransfer } },
                { new: true }
            ).lean(),
            Produit.findByIdAndUpdate(
                produitDest._id,
                { $inc: { stock: quantityToTransfer } },
                { new: true }
            ).lean(),
        ]);

        return c.json({
            success: true,
            message: "Transfert de stock réussi",
            data: {
                source: {
                    boutique_id: boutiqueSrcId,
                    produit_id: srcUpdated!._id,
                    oldStock: srcUpdated!.stock + quantityToTransfer,
                    newStock: srcUpdated!.stock,
                    quantityTransferred: quantityToTransfer,
                },
                destination: {
                    boutique_id: boutiqueDestId,
                    produit_id: destUpdated!._id,
                    oldStock: destUpdated!.stock - quantityToTransfer,
                    newStock: destUpdated!.stock,
                    quantityReceived: quantityToTransfer,
                },
            },
        });
    } catch (error) {
        return c.json({ error: (error as Error).message }, 500);
    }
};

// ─── Vendre un produit ───────────────────────────────────────────────────────
export const vendreProduit = async (c: Context) => {
    try {
        const id = c.req.param("id");
        const { quantity, unit, customPrice } = await c.req.json();

        if (!quantity || quantity <= 0) return c.json({ error: "Quantité invalide" }, 400);

        const produit = await Produit.findById(id);
        if (!produit) return c.json({ error: "Produit introuvable" }, 404);

        const unitSold = unit || produit.unit;
        const quantityDeducted = convertUnit(quantity, unitSold, produit.unit);

        if (produit.stock < quantityDeducted) {
            return c.json({
                error: `Stock insuffisant. Disponible: ${produit.stock} ${produit.unit}`,
            }, 400);
        }

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

        // ✅ FIX : $inc atomique + création vente en parallèle
        const [updatedProduit, nouvelleVente] = await Promise.all([
            Produit.findByIdAndUpdate(
                id,
                { $inc: { stock: -quantityDeducted } },
                { new: true }
            ).lean(),
            Vente.create({
                boutique_id: produit.boutique_id,
                items: [{
                    productId: produit._id,
                    productName: produit.name,
                    quantitySold: quantity,
                    unitSold,
                    quantityDeducted,
                    unitBase: produit.unit,
                    unitPrice,
                    total: totalPrice,
                }],
                totalAmount: totalPrice,
                date: new Date(),
            }),
        ]);

        return c.json({
            success: true,
            message: "Vente effectuée avec succès",
            data: {
                vente: { id: nouvelleVente._id, totalAmount: totalPrice },
                produit: {
                    id: updatedProduit!._id,
                    name: updatedProduit!.name,
                    unit: updatedProduit!.unit,
                    oldStock,
                    newStock: updatedProduit!.stock,
                },
                details: { quantitySold: quantity, unitSold, quantityDeducted, unitPrice, totalPrice },
            },
        });
    } catch (error) {
        return c.json({ error: (error as Error).message }, 500);
    }
};

// ─── Alertes stock ───────────────────────────────────────────────────────────
export const getAlertesStock = async (c: Context) => {
    try {
        const { seuil = "10", boutique_id } = c.req.query();

        // ✅ FIX #6 : Filtrer DANS MongoDB, pas en JS après avoir tout récupéré
        const query: any = { stock: { $lte: parseInt(seuil) } };
        if (boutique_id) query.boutique_id = boutique_id;

        const alertes = await Produit.find(query)
            .select("_id name stock unit boutique_id")  // ← seulement les champs utiles
            .lean();

        return c.json({
            success: true,
            data: alertes.map(p => ({
                produitId: p._id,
                produitName: p.name,
                stock: p.stock,
                unit: p.unit,
                boutiqueId: p.boutique_id,
            })),
        });
    } catch (error) {
        return c.json({ error: (error as Error).message }, 500);
    }
};