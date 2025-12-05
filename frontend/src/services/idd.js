import { openDB } from "idb";

const DB_NAME = "stockapp-db";
const DB_VERSION = 1;

export async function initDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("products")) {
        db.createObjectStore("products", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("transactions")) {
        db.createObjectStore("transactions", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("stock")) {
        db.createObjectStore("stock", { keyPath: "id" });
      }
    },
  });
}

// Produits
export async function addOrUpdateProduct(db, product) {
  return (await db).put("products", product);
}
export async function getAllProducts(db) {
  return (await db).getAll("products");
}

// Transactions
export async function addTransaction(db, tx) {
  return (await db).put("transactions", tx);
}
export async function getAllTransactions(db) {
  return (await db).getAll("transactions");
}

// Stock
export async function addOrUpdateStock(db, item) {
  return (await db).put("stock", item);
}
export async function getAllStock(db) {
  return (await db).getAll("stock");
}
