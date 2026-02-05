//../backend/src/routes/produit.route.ts
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
} from '../controllers/produit.controller.js';

const produitRoutes = new Hono();

// CRUD principal
produitRoutes.post('/', createProduit);
produitRoutes.get('/', getAllProduits);
produitRoutes.get('/alertes-stock', getAlertesStock);
produitRoutes.get('/:id', getProduit);
produitRoutes.put('/:id', updateProduit);
produitRoutes.delete('/:id', deleteProduit);


produitRoutes.post('/:id/vendre', vendreProduit);
produitRoutes.get('/produitByBoutique/:boutiqueId', getProduitsByBoutique);
produitRoutes.post("/products/transfert-stock", transfertStockBoutiques);



export default produitRoutes;