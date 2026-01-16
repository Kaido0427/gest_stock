import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = new Hono();

// CORS
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// Vos routes
import { authRoutes } from "./routes/auth.route.js";
import produitRoutes from './routes/produit.route.js';
app.route('/auth', authRoutes);
app.route('/produit', produitRoutes);

// Chemin absolu vers le dossier public
const publicDir = join(__dirname, '..', 'public');

// Middleware pour servir le frontend
app.use('*', async (c, next) => {
  // Skip les routes API
  if (c.req.path.startsWith('/auth') || c.req.path.startsWith('/produits')) {
    return await next();
  }
  
  try {
    // Pour les requêtes du frontend
    let filePath = c.req.path === '/' ? 'index.html' : c.req.path.replace(/^\//, '');
    const fullPath = join(publicDir, filePath);
    
    // Si le fichier existe, le servir
    if (existsSync(fullPath)) {
      const content = readFileSync(fullPath);
      
      // Déterminer le type MIME
      if (filePath.endsWith('.html')) {
        c.header('Content-Type', 'text/html');
      } else if (filePath.endsWith('.js')) {
        c.header('Content-Type', 'application/javascript');
      } else if (filePath.endsWith('.css')) {
        c.header('Content-Type', 'text/css');
      } else if (filePath.endsWith('.json')) {
        c.header('Content-Type', 'application/json');
      } else if (filePath.endsWith('.png')) {
        c.header('Content-Type', 'image/png');
      } else if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) {
        c.header('Content-Type', 'image/jpeg');
      } else if (filePath.endsWith('.svg')) {
        c.header('Content-Type', 'image/svg+xml');
      }
      
      return c.body(content);
    }
    
    // Si fichier non trouvé, servir index.html (pour SPA)
    const indexPath = join(publicDir, 'index.html');
    if (existsSync(indexPath)) {
      const html = readFileSync(indexPath, 'utf-8');
      c.header('Content-Type', 'text/html');
      return c.html(html);
    }
    
    return await next();
  } catch (error) {
    console.error('Error serving static file:', error);
    return await next();
  }
});

// Route fallback si tout échoue
app.get('/', (c) => {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Erreur - Frontend non trouvé</title>
        <style>
          body { font-family: sans-serif; padding: 2rem; }
          code { background: #f0f0f0; padding: 0.2em 0.4em; }
        </style>
      </head>
      <body>
        <h1>❌ Frontend non trouvé</h1>
        <p>Le dossier <code>public/</code> est vide ou n'existe pas.</p>
        <p>Exécutez ces commandes :</p>
        <pre>
cd frontend
npm run build
cp -r dist/* ../backend/public/
        </pre>
      </body>
    </html>
  `;
  return c.html(html);
});

export default app;