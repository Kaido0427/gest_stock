import { Hono } from 'hono';
import { authRoutes } from "./routes/auth.route.js";
import "dotenv/config";
import { cors } from 'hono/cors';
import { produitRouter } from './routes/produit.route.js';

const app = new Hono();

app.use("*", cors({
  origin: "http://localhost:5173",
  allowMethods: ["GET", "POST", "PUT", "DELETE"],
  allowHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));


app.get("/", (c) => {
  return c.text("Hello Kaido!");
});

app.route("/auth", authRoutes);
app.route("/produit", produitRouter);

export default app;
