import { openDB } from 'idb';

const DB_NAME = 'gest_stock_offline';
const DB_VERSION = 3;

// Schémas de la base de données
const STORES = {
  PRODUCTS: 'products',
  SALES: 'sales',
  PENDING_TRANSACTIONS: 'pending_transactions',
  SYNC_QUEUE: 'sync_queue',
  STOCK_CHANGES: 'stock_changes',
  SETTINGS: 'settings'
};

class OfflineDB {
  constructor() {
    this.db = null;
  }

  async init() {
    this.db = await openDB(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, newVersion, transaction) {
        console.log(`Upgrading DB from ${oldVersion} to ${newVersion}`);

        // Stock initial - v1
        if (!db.objectStoreNames.contains(STORES.PRODUCTS)) {
          const productStore = db.createObjectStore(STORES.PRODUCTS, {
            keyPath: '_id'
          });
          productStore.createIndex('byCategory', 'category');
          productStore.createIndex('byStock', 'variants.stock');
        }

        // Historique des ventes - v2
        if (!db.objectStoreNames.contains(STORES.SALES)) {
          const saleStore = db.createObjectStore(STORES.SALES, {
            keyPath: '_id',
            autoIncrement: true
          });
          saleStore.createIndex('byDate', 'date');
          saleStore.createIndex('byProduct', 'items.productId');
        }

        // Transactions en attente de sync - v2
        if (!db.objectStoreNames.contains(STORES.PENDING_TRANSACTIONS)) {
          const pendingStore = db.createObjectStore(STORES.PENDING_TRANSACTIONS, {
            keyPath: 'localId',
            autoIncrement: true
          });
          pendingStore.createIndex('byType', 'type');
          pendingStore.createIndex('byStatus', 'status');
          pendingStore.createIndex('byTimestamp', 'timestamp');
        }

        // File de synchronisation - v3
        if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
          const syncStore = db.createObjectStore(STORES.SYNC_QUEUE, {
            keyPath: 'id',
            autoIncrement: true
          });
          syncStore.createIndex('byEndpoint', 'endpoint');
          syncStore.createIndex('byPriority', 'priority');
          syncStore.createIndex('byAttempts', 'attempts');
        }

        // Changements de stock - v3
        if (!db.objectStoreNames.contains(STORES.STOCK_CHANGES)) {
          const stockStore = db.createObjectStore(STORES.STOCK_CHANGES, {
            keyPath: 'id',
            autoIncrement: true
          });
          stockStore.createIndex('byProduct', 'productId');
          stockStore.createIndex('byVariant', 'variantId');
          stockStore.createIndex('byResolved', 'resolved');
        }

        // Paramètres - v3
        if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
          db.createObjectStore(STORES.SETTINGS, { keyPath: 'key' });
        }
      }
    });

    return this.db;
  }

  async getDB() {
    if (!this.db) {
      await this.init();
    }
    return this.db;
  }

  // === GESTION DES PRODUITS ===
  async saveProducts(products) {
    const db = await this.getDB();
    const tx = db.transaction(STORES.PRODUCTS, 'readwrite');
    const store = tx.objectStore(STORES.PRODUCTS);

    // Clear existing products
    await store.clear();

    // Add new products
    for (const product of products) {
      // Ensure variants have _id
      const productWithIds = {
        ...product,
        variants: product.variants.map(v => ({
          ...v,
          _id: v._id || `local_${Date.now()}_${Math.random()}`
        }))
      };
      await store.put(productWithIds);
    }

    await tx.done;
    return products.length;
  }

  async getAllProducts() {
    const db = await this.getDB();
    return db.getAll(STORES.PRODUCTS);
  }

  async getProduct(id) {
    const db = await this.getDB();
    return db.get(STORES.PRODUCTS, id);
  }

  async updateProductStock(productId, variantId, quantityChange) {
    const db = await this.getDB();
    const tx = db.transaction(STORES.PRODUCTS, 'readwrite');
    const store = tx.objectStore(STORES.PRODUCTS);

    const product = await store.get(productId);
    if (!product) {
      throw new Error(`Product ${productId} not found`);
    }

    const variant = product.variants.find(v => v._id === variantId);
    if (!variant) {
      throw new Error(`Variant ${variantId} not found`);
    }

    // Update stock
    variant.stock += quantityChange;
    if (variant.stock < 0) variant.stock = 0;

    await store.put(product);
    await tx.done;

    return {
      productId,
      variantId,
      newStock: variant.stock,
      change: quantityChange
    };
  }

  // === GESTION DES VENTES ===
  async saveSale(saleData) {
    const db = await this.getDB();
    const sale = {
      ...saleData,
      _id: saleData._id || `local_sale_${Date.now()}`,
      date: new Date(),
      status: 'local',
      synced: false
    };

    const id = await db.add(STORES.SALES, sale);
    return { ...sale, id };
  }

  async getPendingSales() {
    const db = await this.getDB();
    const allSales = await db.getAll(STORES.SALES);
    return allSales.filter(sale => !sale.synced);
  }

  async markSaleAsSynced(saleId) {
    const db = await this.getDB();
    const tx = db.transaction(STORES.SALES, 'readwrite');
    const store = tx.objectStore(STORES.SALES);

    const sale = await store.get(saleId);
    if (sale) {
      sale.synced = true;
      sale.status = 'synced';
      await store.put(sale);
    }

    await tx.done;
  }

  // === FILE DE SYNCHRONISATION ===
  async addToSyncQueue(endpoint, method, data, priority = 1) {
    const db = await this.getDB();
    const queueItem = {
      endpoint,
      method,
      data,
      priority,
      attempts: 0,
      maxAttempts: 5,
      timestamp: Date.now(),
      lastAttempt: null
    };

    const id = await db.add(STORES.SYNC_QUEUE, queueItem);
    return id;
  }

  async getSyncQueue() {
    const db = await this.getDB();
    return db.getAllFromIndex(STORES.SYNC_QUEUE, 'byPriority');
  }

  async removeFromSyncQueue(id) {
    const db = await this.getDB();
    await db.delete(STORES.SYNC_QUEUE, id);
  }

  async incrementAttempt(id) {
    const db = await this.getDB();
    const tx = db.transaction(STORES.SYNC_QUEUE, 'readwrite');
    const store = tx.objectStore(STORES.SYNC_QUEUE);

    const item = await store.get(id);
    if (item) {
      item.attempts += 1;
      item.lastAttempt = Date.now();
      await store.put(item);
    }

    await tx.done;
  }

  // === GESTION DES CONFLITS DE STOCK ===
  async addStockChange(productId, variantId, oldStock, newStock, action) {
    const db = await this.getDB();
    const change = {
      productId,
      variantId,
      oldStock,
      newStock,
      action, // 'sale', 'restock', 'adjustment'
      timestamp: Date.now(),
      resolved: false,
      conflict: false
    };

    const id = await db.add(STORES.STOCK_CHANGES, change);
    return id;
  }

  async getUnresolvedStockChanges() {
    const db = await this.getDB();
    const all = await db.getAll(STORES.STOCK_CHANGES);
    return all.filter(c => !c.resolved);
  }

  // === PARAMÈTRES ===
  async getSetting(key, defaultValue = null) {
    const db = await this.getDB();
    const setting = await db.get(STORES.SETTINGS, key);
    return setting ? setting.value : defaultValue;
  }

  async setSetting(key, value) {
    const db = await this.getDB();
    await db.put(STORES.SETTINGS, { key, value });
  }

  // === STATUT DE CONNEXION ===
  async setOnlineStatus(isOnline) {
    await this.setSetting('lastOnlineStatus', {
      isOnline,
      timestamp: Date.now()
    });
  }

  async getLastSync() {
    return this.getSetting('lastSync', null);
  }

  async setLastSync(timestamp = Date.now()) {
    await this.setSetting('lastSync', timestamp);
  }

  // === UTILITAIRES ===
  async clearAll() {
    const db = await this.getDB();
    const tx = db.transaction([
      STORES.PRODUCTS,
      STORES.SALES,
      STORES.SYNC_QUEUE,
      STORES.STOCK_CHANGES
    ], 'readwrite');

    await tx.objectStore(STORES.PRODUCTS).clear();
    await tx.objectStore(STORES.SALES).clear();
    await tx.objectStore(STORES.SYNC_QUEUE).clear();
    await tx.objectStore(STORES.STOCK_CHANGES).clear();

    await tx.done;
  }
}

export const offlineDB = new OfflineDB();
export default offlineDB;