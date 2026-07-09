import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
dotenv.config({ path: 'backend/.env' });

async function main() {
  const db = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN
  });
  
  const res = await db.execute('SELECT count(*) as count FROM restaurants');
  console.log('RESTAURANTS IN TURSO DB:', res.rows[0].count);
}
main().catch(console.error);
