import { Hono } from 'hono';
import { authRoutes } from "./routes/auth.route.js";
import "dotenv/config";

const app = new Hono();



app.get("/", (c) => {
  return c.text("Hello Kaido!");
});

app.route("/auth", authRoutes);

export default app;
