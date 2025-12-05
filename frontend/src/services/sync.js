import axios from "axios";
import { getAllProducts, getAllTransactions, getAllStock, initDB } from "./idb";

const API_BASE = "http://localhost:3000"; // backend Hono

export async function syncAll() {
  const db = await initDB();

  try {
    // récupérer tout local
    const products = await getAllProducts(db);
    const transactions = await getAllTransactions(db);
    const stock = await getAllStock(db);

    // envoyer au backend
    const res = await axios.post(`${API_BASE}/sync`, {
      products,
      transactions,
      stock,
    });

    // TODO : merge côté client si backend renvoie des updates
    console.log("Sync terminé :", res.data);
  } catch (err) {
    console.warn("Sync échoué :", err.message);
  }
}
