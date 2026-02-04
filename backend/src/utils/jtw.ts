// utils/jwt.ts (renommez le fichier de jtw.ts à jwt.ts)
import jwt from "jsonwebtoken";

export function generateToken(userId: string) {
  const secret = process.env.JWT_SECRET;
  
  if (!secret || secret === '') {
    console.error('❌ ERREUR CRITIQUE: JWT_SECRET non défini dans .env');
    throw new Error('JWT_SECRET manquant. Vérifiez votre fichier .env');
  }
  
  return jwt.sign({ userId }, secret, { // ← Change "id" en "userId"
    expiresIn: "7d",
  });
}