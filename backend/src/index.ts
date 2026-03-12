import 'dotenv/config'; 
import { serve } from '@hono/node-server'
import app from './app'
import { connectDB } from "./utils/db";

async function main() {
  console.log('JWT_SECRET chargé:', process.env.JWT_SECRET ? '✅ OUI' : '❌ NON');

  await connectDB();

  serve({
    fetch: app.fetch,
    port: 3000
  }, (info) => {
    console.log(`Server is running on http://localhost:${info.port}`)
  });
}

main();