import { Hono } from "hono";
import {
    createProduit,
    getProduit,
    getAllProduits,
    updateProduit,
    deleteProduit,
    approvisionnerProduit
} from "../controllers/produit.controller.js";

export const produitRouter = new Hono();

produitRouter.post("/", createProduit);
produitRouter.get("/", getAllProduits);
produitRouter.get("/:id", getProduit);
produitRouter.put("/:id", updateProduit);
produitRouter.delete("/:id", deleteProduit);
produitRouter.post("/:id/approvisionner", approvisionnerProduit);
