// backend/src/routes/auth.route.ts
// backend/src/routes/auth.route.ts
import { Hono } from "hono";
import { AuthController } from "../controllers/auth.controller.js";


console.log("🟢 [AUTH ROUTE] AuthController:", AuthController);
console.log("🟢 [AUTH ROUTE] AuthController.getMe:", AuthController.getMe);
console.log("🟢 [AUTH ROUTE] AuthController.register:", AuthController.register);
console.log("🟢 [AUTH ROUTE] AuthController.login:", AuthController.login);
console.log("🟢 [AUTH ROUTE] AuthController.logout:", AuthController.logout);

export const authRoutes = new Hono();

console.log("🟢 [AUTH ROUTE] authRoutes instance:", authRoutes);
console.log("🟢 [AUTH ROUTE] authRoutes.get:", typeof authRoutes.get);
console.log("🟢 [AUTH ROUTE] authRoutes.post:", typeof authRoutes.post);

authRoutes.get("/me", AuthController.getMe);
console.log("🟢 [AUTH ROUTE] Après enregistrement GET /me");

authRoutes.post("/register", AuthController.register);
console.log("🟢 [AUTH ROUTE] Après enregistrement POST /register");

authRoutes.post("/login", AuthController.login);
console.log("🟢 [AUTH ROUTE] Après enregistrement POST /login");

authRoutes.post("/logout", AuthController.logout);
console.log("🟢 [AUTH ROUTE] Après enregistrement POST /logout");

console.log("✅ [AUTH ROUTE] authRoutes final:", authRoutes);