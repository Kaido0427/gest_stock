import { Hono } from 'hono';
import { authRoutes } from "./routes/auth.route.js";
import "dotenv/config";
import { cors } from 'hono/cors';

const app = new Hono();

app.use("*", cors({
  origin: "*",           // ou "http://localhost:5173"
  allowMethods: ["GET", "POST", "PUT", "DELETE"],
  allowHeaders: ["Content-Type", "Authorization"],
}));


app.get("/", (c) => {
  return c.text("Hello Kaido!");
});

app.route("/auth", authRoutes);

export default app;
