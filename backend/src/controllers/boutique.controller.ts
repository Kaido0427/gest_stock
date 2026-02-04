import type { Context } from "hono";
import { Boutique } from "../models/boutique.model.js";
import { User } from "../models/user.model.js";
import bcrypt from "bcryptjs";

// Récupérer toutes les boutiques
export const getAllBoutiques = async (c: Context) => {
    try {

        console.log("Fetching all boutiques...");
        const boutiques = await Boutique.find().populate("responsable_id", "name email");
        console.log(`Found ${boutiques.length} boutiques.`);
        return c.json(boutiques);
    } catch (error) {
        const err = error as Error;
        return c.json({ error: err.message }, 500);
    }
};


// Seed : Créer 5 boutiques avec leurs responsables
export const seedBoutiques = async (c: Context) => {
  try {
    const boutiquesData = [
      {
        name: "Mahoutodji Cococodji",
        description: "Point de vente Mahoutodji - Cococodji",
        address: "Cococodji, Cotonou",
        phone: "+229 97 00 00 01",
        email: "cococodji@mahoutodji.online",
        password: "Cococodji@2026!"
      },
      {
        name: "Mahoutodji Tokpa",
        description: "Point de vente Mahoutodji - Tokpa",
        address: "Marché Tokpa, Cotonou",
        phone: "+229 97 00 00 02",
        email: "tokpa@mahoutodji.online",
        password: "Tokpa@2026!"
      },
      {
        name: "Mahoutodji Calavi",
        description: "Point de vente Mahoutodji - Calavi",
        address: "Calavi Centre, Abomey-Calavi",
        phone: "+229 97 00 00 03",
        email: "calavi@mahoutodji.online",
        password: "Calavi@2026!"
      },
      {
        name: "Mahoutodji Allada",
        description: "Point de vente Mahoutodji - Allada",
        address: "Centre-ville, Allada",
        phone: "+229 97 00 00 04",
        email: "allada@mahoutodji.online",
        password: "Allada@2026!"
      },
      {
        name: "Mahoutodji Togba",
        description: "Point de vente Mahoutodji - Togba",
        address: "Togba, Cotonou",
        phone: "+229 97 00 00 05",
        email: "togba@mahoutodji.online",
        password: "Togba@2026!"
      }
    ];

    const results = [];

    for (const data of boutiquesData) {
      // Hash du mot de passe
      const hashedPassword = await bcrypt.hash(data.password, 10);

      // Créer l'utilisateur
      const user = await User.create({
        email: data.email,
        password: hashedPassword,
      });

      // Créer la boutique
      const boutique = await Boutique.create({
        name: data.name,
        description: data.description,
        address: data.address,
        phone: data.phone,
        responsable_id: user._id,
      });

      results.push({
        boutique: data.name,
        email: data.email,
        password: data.password,
        boutique_id: boutique._id,
        user_id: user._id
      });
    }

    return c.json({
      message: "✅ 5 boutiques Mahoutodji créées avec succès",
      boutiques: results
    }, 201);

  } catch (error) {
    const err = error as Error;
    return c.json({ error: err.message }, 500);
  }
};