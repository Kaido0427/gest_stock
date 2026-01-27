//../backend/src/routes/produit.route.ts
import { Hono } from 'hono';
import {
    createProduit,
    getProduit,
    getAllProduits,
    updateProduit,
    deleteProduit,
    deleteVariant,
    approvisionnerVariant,
    vendreProduit,
    getAlertesStock,
    getProduitsByBoutique
} from '../controllers/produit.controller.js';

const produitRoutes = new Hono();

// CRUD principal
produitRoutes.post('/', createProduit);
produitRoutes.get('/', getAllProduits);
produitRoutes.get('/alertes-stock', getAlertesStock);
produitRoutes.get('/:id', getProduit);
produitRoutes.put('/:id', updateProduit);
produitRoutes.delete('/:id', deleteProduit);

// Gestion des variantes
produitRoutes.delete('/:id/variant', deleteVariant);
produitRoutes.post('/:id/approvisionner', approvisionnerVariant);
produitRoutes.post('/:id/vendre', vendreProduit);
produitRoutes.get('/produitByBoutique/:boutiqueId', getProduitsByBoutique);



export default produitRoutes;