// routes/vente.routes.ts
import { Hono } from 'hono';
import {
  validerVente,
  getHistoriqueVentes,
  getVenteById,
  getStatistiquesVentes
} from '../controllers/vente.controller.js';

const venteRoutes = new Hono();

// Ventes
venteRoutes.post('/', validerVente);
venteRoutes.get('/', getHistoriqueVentes);
venteRoutes.get('/stats', getStatistiquesVentes);
venteRoutes.get('/:id', getVenteById);

export default venteRoutes;