import mongoose from "mongoose";

export async function connectDB() {
  try {
    // Solution : Soit mettre une valeur par défaut, soit utiliser MONGO_URI
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb://localhost:27017/gest_stock";
    
    if (!mongoUri) {
      throw new Error("❌ MongoDB URI non définie. Ajoutez MONGODB_URI ou MONGO_URI dans .env");
    }
    
    await mongoose.connect(mongoUri);
    console.log("✅ MongoDB connecté ✔");
  } catch (err) {
    console.error("❌ Erreur MongoDB :", err);
    process.exit(1);
  }
}