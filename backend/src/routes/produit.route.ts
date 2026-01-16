import { Hono } from 'hono';
import {
    createProduit,
    getProduit,
    getAllProduits,
    updateProduit,
    deleteProduit,
    deleteVariant,
    approvisionnerVariant
} from '../controllers/produit.controller.js';

const produitRoutes = new Hono();

// CRUD principal
produitRoutes.post('/', createProduit);
produitRoutes.get('/', getAllProduits);
produitRoutes.get('/:id', getProduit);
produitRoutes.put('/:id', updateProduit);
produitRoutes.delete('/:id', deleteProduit);

// Gestion des variantes
produitRoutes.delete('/:id/variant', deleteVariant);
produitRoutes.post('/:id/approvisionner', approvisionnerVariant);


export default produitRoutes;