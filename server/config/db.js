const { Pool } = require('pg');
require('dotenv').config();

let pool;

if (process.env.DATABASE_URL) {
  // Use production or custom PostgreSQL instance via DATABASE_URL
  const isProduction = process.env.NODE_ENV === 'production' || process.env.DATABASE_URL.includes('render.com');
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: isProduction ? { rejectUnauthorized: false } : false
  });
  console.log('✅ Connected to PostgreSQL via DATABASE_URL');
} else {
  // Fallback to in-memory PostgreSQL instance for local development if no DATABASE_URL is set
  try {
    const { newDb } = require('pg-mem');
    const memDb = newDb();
    const PgAdapter = memDb.adapters.createPg();
    pool = new PgAdapter.Pool();
    console.log('✅ Connected to in-memory PostgreSQL database (development mode)');
  } catch (err) {
    pool = new Pool();
    console.log('✅ Connected to local PostgreSQL default pool');
  }
}

// Initialize database tables using PostgreSQL SQL syntax
const initTables = async () => {
  try {
    // 1. Users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Users table ready (PostgreSQL).');

    // 2. Tasks table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        completed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ Tasks table ready (PostgreSQL).');
  } catch (err) {
    console.error('❌ Error creating PostgreSQL tables:', err.message);
  }
};

initTables();

module.exports = pool;
