import { Hono } from 'hono';
import { cors } from 'hono/cors';

import { authRoutes } from "./routes/auth.route.js";
import produitRoutes from './routes/produit.route.js';
import venteRoutes from './routes/vente.routes.js';
import { boutiqueRouter } from './routes/boutique.routes.js';

const app = new Hono();

// CORS (frontend séparé)
app.use('*', cors({
  origin: '*', // plus tard tu pourras restreindre
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Routes API
app.route('/auth', authRoutes);
app.route('/produit', produitRoutes);
app.route('/ventes', venteRoutes);
app.route('/boutiques', boutiqueRouter);

// Health check (optionnel mais pro)
app.get('/', (c) => {
  return c.json({
    status: 'OK',
    message: 'GestStock API is running wesh'
  });
});

export default app;
