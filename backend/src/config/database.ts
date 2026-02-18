import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
import * as schema from '../models/schema.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Ensure env vars are loaded if this file is imported standalone (e.g. by scripts)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.join(__dirname, '..', '..', '.env');
dotenv.config({ path: envPath });

const { Pool } = pkg;

// Initialize Drizzle ORM instance with pool
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn('DATABASE_URL is not set in environment variables. DB calls will fail.');
}

export const pool = new Pool({
  connectionString: connectionString,
});

// Pass schema to drizzle to enable Query API (db.query.table.findMany)
export const db = drizzle(pool, { schema });

export const initializeDatabase = async () => {
  try {
    // Test connection
    const result = await pool.query('SELECT NOW()');
    console.log('✓ Database connection test successful:', result.rows[0]);
    return db;
  } catch (error) {
    console.error('Database connection failed:', error);
    throw error;
  }
};

export const getDb = () => db;
