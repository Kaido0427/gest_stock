import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["admin", "employe"], default: "employe" },
    name: { type: String, trim: true },
    // ✅ Lien direct boutique → permet de trouver la boutique d'un employé
    //    même s'il n'est pas responsable_id (compte secondaire)
    boutique_id: { type: mongoose.Schema.Types.ObjectId, ref: "Boutique", default: null }
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
