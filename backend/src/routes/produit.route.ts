// backend/src/routes/produit.route.ts
import { Hono } from 'hono';
import {
  createProduit,
  getProduit,
  getAllProduits,
  updateProduit,
  deleteProduit,
  vendreProduit,
  getAlertesStock,
  getProduitsByBoutique,
  transfertStockBoutiques,
  approvisionnerProduit
} from '../controllers/produit.controller.js';

const produitRoutes = new Hono();

// ========================================
// ✅ ORDRE CORRECT DES ROUTES
// ========================================

// 1️⃣ Routes GET spécifiques AVANT /:id
produitRoutes.get('/alertes-stock', getAlertesStock);
produitRoutes.get('/produitByBoutique/:boutiqueId', getProduitsByBoutique);

// 2️⃣ Routes POST spécifiques AVANT /:id
produitRoutes.post('/transfert-stock', transfertStockBoutiques);

// 3️⃣ CRUD de base
produitRoutes.post('/', createProduit);
produitRoutes.get('/', getAllProduits);

// 4️⃣ Routes avec paramètre :id (TOUJOURS EN DERNIER)
produitRoutes.get('/:id', getProduit);
produitRoutes.put('/:id', updateProduit);
produitRoutes.delete('/:id', deleteProduit);

// 5️⃣ Routes POST avec :id et action
produitRoutes.post('/:id/vendre', vendreProduit);
produitRoutes.post('/:id/approvisionner', approvisionnerProduit);

export default produitRoutes;