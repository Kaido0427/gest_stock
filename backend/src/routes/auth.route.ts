import { Hono } from "hono";
import { AuthController } from "../controllers/auth.controller.js";

export const authRoutes = new Hono();

authRoutes.post("/register", (c) => AuthController.register(c));
authRoutes.post("/login", (c) => AuthController.login(c));
