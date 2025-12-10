import 'dotenv/config'; 
import { serve } from '@hono/node-server'
import app from './app.js'
import { connectDB } from "./utils/db.js";

// Vérifiez que JWT_SECRET est chargé
console.log('JWT_SECRET chargé:', process.env.JWT_SECRET ? '✅ OUI' : '❌ NON');

await connectDB();

serve({


  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})
