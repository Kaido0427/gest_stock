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


// Seed : Créer 2 boutiques avec 2 users
export const seedBoutiques = async (c: Context) => {
    try {
        // Nettoyer les collections
        //await User.deleteMany({});
        //await Boutique.deleteMany({});

        // Hash des mots de passe
        const hashedPassword1 = await bcrypt.hash("password123", 10);
        const hashedPassword2 = await bcrypt.hash("password456", 10);

        // Créer les utilisateurs
        const user1 = await User.create({
            email: "responsable1@boutique.com",
            password: hashedPassword1,
        });

        const user2 = await User.create({
            email: "responsable2@boutique.com",
            password: hashedPassword2,
        });

        // Créer les boutiques
        const boutique1 = await Boutique.create({
            name: "Boutique Centre-Ville",
            description: "Boutique principale située au centre-ville",
            address: "123 Avenue de la République, Cotonou",
            phone: "+229 97 00 00 01",
            responsable_id: user1._id,
        });

        const boutique2 = await Boutique.create({
            name: "Boutique Akpakpa",
            description: "Boutique secondaire dans le quartier Akpakpa",
            address: "456 Rue des Palmiers, Akpakpa, Cotonou",
            phone: "+229 97 00 00 02",
            responsable_id: user2._id,
        });

        return c.json({
            message: "Seed effectué avec succès",
            users: [
                { email: user1.email, password: "password123", id: user1._id },
                { email: user2.email, password: "password456", id: user2._id }
            ],
            boutiques: [
                { name: boutique1.name, id: boutique1._id, responsable: user1.email },
                { name: boutique2.name, id: boutique2._id, responsable: user2.email }
            ]
        }, 201);
    } catch (error) {
        const err = error as Error;
        return c.json({ error: err.message }, 500);
    }
};