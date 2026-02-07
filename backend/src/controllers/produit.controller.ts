import type { Context } from "hono";
import { Produit, UnitType } from "../models/produit.model.js";
import mongoose from "mongoose";
import { Vente } from "../models/vente.model.js";
import { Boutique } from "../models/boutique.model.js";

// ✅ Helper function pour les conversions d'unités
const convertUnit = (quantity: number, fromUnit: string, toUnit: string): number => {
    if (fromUnit === toUnit) return quantity;

    const liquidToLiter: { [key: string]: number } = {
        'kL': 1000, 'L': 1, 'cL': 0.01, 'mL': 0.001
    };

    const weightToKg: { [key: string]: number } = {
        't': 1000, 'kg': 1, 'g': 0.001, 'mg': 0.000001
    };

    if (liquidToLiter[fromUnit] && liquidToLiter[toUnit]) {
        const inLiters = quantity * liquidToLiter[fromUnit];
        return inLiters / liquidToLiter[toUnit];
    }

    if (weightToKg[fromUnit] && weightToKg[toUnit]) {
        const inKg = quantity * weightToKg[fromUnit];
        return inKg / weightToKg[toUnit];
    }

    return quantity;
};

// ✅ Helper function pour calculer le prix en fonction de l'unité
const calculatePrice = (basePrice: number, baseUnit: string, soldUnit: string, quantity: number): number => {
    const convertedQuantity = convertUnit(quantity, soldUnit, baseUnit);
    return basePrice * convertedQuantity;
};

// ✅ NOUVELLE ROUTE : Créer un produit dans plusieurs boutiques
export const createProduitMultiBoutiques = async (c: Context) => {
    try {
        const body = await c.req.json();
        const { boutiques, ...produitData } = body;

        // ✅ Validation
        if (!boutiques || !Array.isArray(boutiques) || boutiques.length === 0) {
            return c.json({
                error: "Vous devez sélectionner au moins une boutique"
            }, 400);
        }

        if (!produitData.name || !produitData.unit || !produitData.basePrice) {
            return c.json({
                error: "Nom, unité et prix de base sont requis"
            }, 400);
        }

        if (produitData.basePrice <= 0) {
            return c.json({
                error: "Le prix de base doit être supérieur à 0"
            }, 400);
        }

        // ✅ Créer le produit pour chaque boutique
        const produitsCreated = [];
        const errors = [];

        for (const boutique of boutiques) {
            try {
                const produit = await Produit.create({
                    name: produitData.name,
                    description: produitData.description,
                    category: produitData.category,
                    stock: boutique.stock || 0,
                    unit: produitData.unit,
                    basePrice: produitData.basePrice,
                    boutique_id: boutique.boutique_id,
                    metadata: produitData.metadata
                });

                produitsCreated.push({
                    boutique_id: boutique.boutique_id,
                    produit_id: produit._id,
                    stock: produit.stock
                });
            } catch (error) {
                errors.push({
                    boutique_id: boutique.boutique_id,
                    error: (error as Error).message
                });
            }
        }

        // ✅ Retourner le résultat
        if (errors.length > 0 && produitsCreated.length === 0) {
            return c.json({
                error: "Échec de la création dans toutes les boutiques",
                details: errors
            }, 500);
        }

        return c.json({
            success: true,
            message: `Produit créé dans ${produitsCreated.length} boutique(s)`,
            produits: produitsCreated,
            errors: errors.length > 0 ? errors : undefined
        }, 201);
    } catch (error) {
        const err = error as Error;
        return c.json({ error: err.message }, 500);
    }
};

// ➤ 1. Créer un produit (ancienne méthode - pour une seule boutique)
export const createProduit = async (c: Context) => {
    try {
        const body = await c.req.json();

        if (!body.boutique_id) {
            return c.json({
                error: "L'ID de la boutique est requis"
            }, 400);
        }

        if (body.stock === undefined || body.stock < 0) {
            return c.json({
                error: "Le stock doit être un nombre positif"
            }, 400);
        }

        if (!body.unit || !Object.values(UnitType).includes(body.unit)) {
            return c.json({
                error: "L'unité doit être valide"
            }, 400);
        }

        if (!body.basePrice || body.basePrice < 0) {
            return c.json({
                error: "Le prix de base doit être un nombre positif"
            }, 400);
        }

        const produit = await Produit.create({
            name: body.name,
            description: body.description,
            category: body.category,
            stock: body.stock,
            unit: body.unit,
            basePrice: body.basePrice,
            boutique_id: body.boutique_id,
            metadata: body.metadata
        });

        return c.json({
            message: "Produit créé avec succès",
            produit
        }, 201);
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

        if (body.name !== undefined) produit.name = body.name;
        if (body.description !== undefined) produit.description = body.description;
        if (body.category !== undefined) produit.category = body.category;
        if (body.stock !== undefined && body.stock >= 0) produit.stock = body.stock;
        if (body.unit !== undefined && Object.values(UnitType).includes(body.unit)) {
            produit.unit = body.unit;
        }
        if (body.basePrice !== undefined && body.basePrice >= 0) {
            produit.basePrice = body.basePrice;
        }
        if (body.boutique_id !== undefined) produit.boutique_id = body.boutique_id;
        if (body.metadata !== undefined) produit.metadata = body.metadata;

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

// ➤ 6. APPROVISIONNER un produit
export const approvisionnerProduit = async (c: Context) => {
    console.group("📦 [BACKEND] approvisionnerProduit");
    try {
        const id = c.req.param("id");
        const { quantity, unit } = await c.req.json();

        console.log("➡ Requête reçue:", { id, quantity, unit });

        if (!quantity || quantity <= 0) {
            console.warn("❌ Quantité invalide");
            return c.json({ error: "Quantité invalide" }, 400);
        }

        const produit = await Produit.findById(id);
        if (!produit) {
            console.warn("❌ Produit introuvable:", id);
            return c.json({ error: "Produit introuvable" }, 404);
        }

        console.log("✅ Produit trouvé:", produit.name);

        let quantityToAdd = quantity;
        if (unit && unit !== produit.unit) {
            quantityToAdd = convertUnit(quantity, unit, produit.unit);
            console.log(`🔄 Conversion: ${quantity} ${unit} → ${quantityToAdd} ${produit.unit}`);
        }

        const oldStock = produit.stock;
        produit.stock += quantityToAdd;
        await produit.save();

        console.log(`✅ Stock mis à jour: ${oldStock} → ${produit.stock}`);
        console.log("🎉 Approvisionnement réussi");

        return c.json({
            success: true,
            message: "Approvisionnement effectué",
            produit: {
                id: produit._id,
                name: produit.name,
                unit: produit.unit,
                oldStock,
                newStock: produit.stock,
                quantityAdded: quantityToAdd
            }
        });
    } catch (error) {
        const err = error as Error;
        console.error("🔥 Erreur approvisionnerProduit:", err);
        return c.json({ error: err.message }, 500);
    } finally {
        console.groupEnd();
    }
};

// ➤ 8. TRANSFERT DE STOCK ENTRE BOUTIQUES
export const transfertStockBoutiques = async (c: Context) => {
    console.group("🔄 [BACKEND] transfertStockBoutiques");
    try {
        const { produitId, boutiqueSrcId, boutiqueDestId, quantity, unit } = await c.req.json();

        console.log("➡ Requête reçue :", { produitId, boutiqueSrcId, boutiqueDestId, quantity, unit });

        if (!produitId || !boutiqueSrcId || !boutiqueDestId || !quantity || quantity <= 0) {
            console.warn("❌ Données invalides");
            return c.json({ error: "Données invalides" }, 400);
        }

        if (boutiqueSrcId === boutiqueDestId) {
            console.warn("❌ Source et destination identiques");
            return c.json({ error: "La boutique source et destination doivent être différentes" }, 400);
        }

        const produitDest = await Produit.findOne({
            _id: produitId,
            boutique_id: boutiqueDestId
        });

        if (!produitDest) {
            console.warn("❌ Produit introuvable dans la boutique destination:", { produitId, boutiqueDestId });
            return c.json({ error: "Produit introuvable dans la boutique de destination" }, 404);
        }

        console.log("✅ Produit destination trouvé:", produitDest.name);

        const produitSrc = await Produit.findOne({
            name: produitDest.name,
            boutique_id: boutiqueSrcId
        });

        if (!produitSrc) {
            console.warn("❌ Produit introuvable dans la boutique source:", { nom: produitDest.name, boutiqueSrcId });
            return c.json({ 
                error: `Le produit "${produitDest.name}" n'existe pas dans la boutique source sélectionnée` 
            }, 404);
        }

        console.log("✅ Produit source trouvé:", produitSrc.name);

        const unitToUse = unit || produitSrc.unit;
        let quantityToTransfer = quantity;

        if (unitToUse !== produitSrc.unit) {
            quantityToTransfer = convertUnit(quantity, unitToUse, produitSrc.unit);
            console.log(`🔄 Conversion: ${quantity} ${unitToUse} → ${quantityToTransfer} ${produitSrc.unit}`);
        }

        console.log("📦 Quantité à transférer:", quantityToTransfer, produitSrc.unit);

        if (produitSrc.stock < quantityToTransfer) {
            console.warn("❌ Stock insuffisant:", produitSrc.stock, "<", quantityToTransfer);
            return c.json({
                error: `Stock insuffisant dans la boutique source. Stock disponible: ${produitSrc.stock} ${produitSrc.unit}`
            }, 400);
        }

        const oldStockSrc = produitSrc.stock;
        produitSrc.stock -= quantityToTransfer;
        await produitSrc.save();

        console.log("✅ Stock source mis à jour:", oldStockSrc, "→", produitSrc.stock);

        const oldStockDest = produitDest.stock;
        produitDest.stock += quantityToTransfer;
        await produitDest.save();

        console.log("✅ Stock destination mis à jour:", oldStockDest, "→", produitDest.stock);
        console.log("🎉 Transfert terminé avec succès");

        return c.json({
            success: true,
            message: "Transfert de stock réussi",
            data: {
                source: {
                    boutique_id: boutiqueSrcId,
                    produit_id: produitSrc._id,
                    oldStock: oldStockSrc,
                    newStock: produitSrc.stock,
                    quantityTransferred: quantityToTransfer
                },
                destination: {
                    boutique_id: boutiqueDestId,
                    produit_id: produitDest._id,
                    oldStock: oldStockDest,
                    newStock: produitDest.stock,
                    quantityReceived: quantityToTransfer
                }
            }
        });
    } catch (error) {
        const err = error as Error;
        console.error("🔥 Erreur transfertStockBoutiques :", err);
        return c.json({ error: err.message }, 500);
    } finally {
        console.groupEnd();
    }
};
// ➤ 7. VENDRE un produit (la complexité est ici !)
export const vendreProduit = async (c: Context) => {
    console.group("🛒 [BACKEND] vendreProduit");
    try {
        const id = c.req.param("id");
        const { quantity, unit, customPrice } = await c.req.json();

        console.log("➡ Requête reçue :", { produitId: id, quantity, unit, customPrice });

        // Validation
        if (!quantity || quantity <= 0) {
            console.warn("❌ Quantité invalide :", quantity);
            return c.json({ error: "Quantité invalide" }, 400);
        }

        const produit = await Produit.findById(id);
        if (!produit) {
            console.warn("❌ Produit introuvable :", id);
            return c.json({ error: "Produit introuvable" }, 404);
        }

        // ✅ Déterminer l'unité de vente (si pas fournie, utiliser l'unité de base)
        const unitSold = unit || produit.unit;

        // ✅ Convertir la quantité vendue en unité de base pour déduire du stock
        const quantityDeducted = convertUnit(quantity, unitSold, produit.unit);

        console.log("📊 Stock avant vente :", {
            oldStock: produit.stock,
            unit: produit.unit,
            quantityToDeduct: quantityDeducted
        });

        // Vérifier le stock
        if (produit.stock < quantityDeducted) {
            console.warn("❌ Stock insuffisant :", {
                requested: quantityDeducted,
                available: produit.stock
            });
            return c.json({
                error: `Stock insuffisant. Stock disponible: ${produit.stock} ${produit.unit}`
            }, 400);
        }

        // ✅ Calculer le prix (avec possibilité de prix personnalisé)
        let totalPrice: number;
        let unitPrice: number;

        if (customPrice !== undefined && customPrice >= 0) {
            // Prix personnalisé fourni
            totalPrice = customPrice;
            unitPrice = customPrice / quantity;
        } else {
            // Calculer selon le prix de base
            totalPrice = calculatePrice(produit.basePrice, produit.unit, unitSold, quantity);
            unitPrice = totalPrice / quantity;
        }

        // ✅ Retirer du stock
        const oldStock = produit.stock;
        produit.stock -= quantityDeducted;
        await produit.save();

        // ✅ Enregistrer la vente
        const nouvelleVente = await Vente.create({
            boutique_id: produit.boutique_id,
            items: [{
                productId: produit._id,
                productName: produit.name,
                quantitySold: quantity,
                unitSold: unitSold,
                quantityDeducted: quantityDeducted,
                unitBase: produit.unit,
                unitPrice: unitPrice,
                total: totalPrice
            }],
            totalAmount: totalPrice,
            date: new Date()
        });

        console.log("🎉 Vente historisée :", nouvelleVente._id);
        console.log("✅ Vente enregistrée :", {
            oldStock,
            newStock: produit.stock,
            quantitySold: quantity,
            unitSold,
            quantityDeducted,
            unitBase: produit.unit
        });

        return c.json({
            success: true,
            message: "Vente effectuée avec succès",
            data: {
                vente: {
                    id: nouvelleVente._id,
                    totalAmount: totalPrice
                },
                produit: {
                    id: produit._id,
                    name: produit.name,
                    unit: produit.unit,
                    oldStock,
                    newStock: produit.stock
                },
                details: {
                    quantitySold: quantity,
                    unitSold: unitSold,
                    quantityDeducted: quantityDeducted,
                    unitPrice: unitPrice,
                    totalPrice: totalPrice
                }
            }
        });
    } catch (error) {
        const err = error as Error;
        console.error("🔥 Erreur vendreProduit :", err);
        return c.json({ error: err.message }, 500);
    } finally {
        console.groupEnd();
    }
};
// ➤ 8. Alertes stock
export const getAlertesStock = async (c: Context) => {
    try {
        console.log("🔵 getAlertesStock appelé");
        const { seuil = 10, boutique_id } = c.req.query();
        console.log("🔵 Params:", { seuil, boutique_id });

        let query: any = {};
        if (boutique_id) {
            query.boutique_id = boutique_id;
        }

        const produits = await Produit.find(query);
        console.log("🔵 Produits trouvés:", produits.length);

        const alertes: any[] = [];
        for (const produit of produits) {
            if (produit.stock <= parseInt(seuil as string)) {
                alertes.push({
                    produitId: produit._id,
                    produitName: produit.name,
                    stock: produit.stock,
                    unit: produit.unit,
                    boutiqueId: produit.boutique_id
                });
            }
        }

        console.log("🔵 Alertes générées:", alertes.length);

        return c.json({ success: true, data: alertes });
    } catch (error) {
        console.error("❌ Erreur getAlertesStock:", error);
        return c.json({ error: (error as Error).message }, 500);
    }
};
// ➤ 2. Voir un produit par ID
export const getProduit = async (c: Context) => {
    try {
        const id = c.req.param("id");
        const produit = await Produit.findById(id).populate("boutique_id", "name address"); // ✅ Populate pour avoir les infos de la boutique

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
        const produits = await Produit.find().populate("boutique_id", "name address"); // ✅ Populate
        return c.json(produits);
    } catch (error) {
        const err = error as Error;
        return c.json({ error: err.message }, 500);
    }
};
// ➤ 3b. Voir tous les produits d'une boutique spécifique
export const getProduitsByBoutique = async (c: Context) => {
    try {
        const boutique_id = c.req.param("boutique_id");

        if (!mongoose.Types.ObjectId.isValid(boutique_id)) {
            return c.json({ error: "ID de boutique invalide" }, 400);
        }

        const produits = await Produit.find({ boutique_id }).populate("boutique_id", "name address");
        return c.json(produits);
    } catch (error) {
        const err = error as Error;
        return c.json({ error: err.message }, 500);
    }
};

