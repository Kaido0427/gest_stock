import { Hono } from "hono";
import bcrypt from "bcryptjs";
import { User } from "../models/user.model";
import { Plan } from "../models/plan.model";
import { invalidateAllPlansCache } from "../utils/plan.cache";

const seedRoutes = new Hono();

seedRoutes.post("/super-admin", async (c) => {
    try {
        const { secret, email, password, name } = await c.req.json();
        const seedSecret = process.env.SEED_SECRET;
        if (!seedSecret) return c.json({ error: "SEED_SECRET non configuré" }, 500);
        if (secret !== seedSecret) return c.json({ error: "Secret invalide" }, 403);
        if (!email || !password) return c.json({ error: "Email et mot de passe requis" }, 400);
        const existing = await User.findOne({ role: "super_admin" });
        if (existing) return c.json({ error: "Un super admin existe déjà" }, 409);
        const hashed = await bcrypt.hash(password, 10);
        const superAdmin = await User.create({ email, password: hashed, name: name || "Super Admin", role: "super_admin", isActive: true });
        return c.json({ message: "Super admin créé", user: { id: superAdmin._id, email: superAdmin.email, name: superAdmin.name, role: superAdmin.role } }, 201);
    } catch (error) { return c.json({ error: (error as Error).message }, 500); }
});

seedRoutes.post("/plans", async (c) => {
    try {
        const { secret } = await c.req.json();
        const seedSecret = process.env.SEED_SECRET;
        if (!seedSecret || secret !== seedSecret) return c.json({ error: "Secret invalide" }, 403);
        const existingCount = await Plan.countDocuments();
        if (existingCount > 0) return c.json({ error: "Des plans existent déjà" }, 409);
        const defaultPlans = [
            { name: "starter", label: "Starter", price: 2000, currency: "XOF", isActive: true, isDefault: true, sortOrder: 1, color: "slate", description: "Idéal pour démarrer", limits: { boutiques: 0, produits: 100, employes: 1, historiqueJours: 30 }, features: { transfertInterBoutiques: false, statsAvancees: false, export: false } },
            { name: "business", label: "Business", price: 8000, currency: "XOF", isActive: true, isDefault: false, sortOrder: 2, color: "blue", description: "Pour les boutiques en croissance", limits: { boutiques: 2, produits: 1000, employes: 10, historiqueJours: 180 }, features: { transfertInterBoutiques: true, statsAvancees: true, export: true } },
            { name: "enterprise", label: "Enterprise", price: 20000, currency: "XOF", isActive: true, isDefault: false, sortOrder: 3, color: "purple", description: "Illimité, pour les grandes structures", limits: { boutiques: -1, produits: -1, employes: -1, historiqueJours: -1 }, features: { transfertInterBoutiques: true, statsAvancees: true, export: true } },
        ];
        await Plan.insertMany(defaultPlans);
        invalidateAllPlansCache();
        return c.json({ message: `${defaultPlans.length} plans créés`, plans: defaultPlans }, 201);
    } catch (error) { return c.json({ error: (error as Error).message }, 500); }
});

seedRoutes.get("/status", async (c) => {
    try {
        console.log("🔍 /seed/status appelé");
        const superAdminCount = await User.countDocuments({ role: "super_admin" });
        console.log("👤 superAdminCount:", superAdminCount);
        const planCount = await Plan.countDocuments();
        console.log("📋 planCount:", planCount);
        return c.json({ superAdminExists: superAdminCount > 0, plansSeeded: planCount > 0, planCount });
    } catch (error) {
        console.error("❌ Erreur /seed/status:", (error as Error).message);
        return c.json({ error: (error as Error).message }, 500);
    }
});

export { seedRoutes };