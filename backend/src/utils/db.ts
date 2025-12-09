import mongoose from "mongoose";

export async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI!);
    console.log("MongoDB connecté ✔");
  } catch (err) {
    console.error("Erreur MongoDB :", err);
    process.exit(1);
  }
}
