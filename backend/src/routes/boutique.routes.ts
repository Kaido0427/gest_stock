import { Hono } from 'hono';

import {
    getAllBoutiques,
    seedBoutiques
} from '../controllers/boutique.controller.js';

export const boutiqueRouter = new Hono();

// Route pour récupérer toutes les boutiques
boutiqueRouter.get('/', getAllBoutiques); 
boutiqueRouter.post('/seed', seedBoutiques); 