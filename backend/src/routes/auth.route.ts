import { Hono } from "hono";
import { AuthController } from "../controllers/auth.controller";

export const authRoutes = new Hono();

authRoutes.get("/me", AuthController.getMe);
authRoutes.post("/register", AuthController.register);
authRoutes.post("/login", AuthController.login);
authRoutes.post("/logout", AuthController.logout);