const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Store the SQLite database file inside the server directory as database.sqlite
const dbPath = path.join(__dirname, '..', 'database.sqlite');

// Initialize database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error opening SQLite database:', err.message);
  } else {
    console.log(`✅ Connected to SQLite database file at: ${dbPath}`);
    initTables();
  }
});

// Create initial database tables for Users and Tasks if they do not exist yet
function initTables() {
  db.serialize(() => {
    // 1. Users table
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) console.error('❌ Error creating users table:', err.message);
      else console.log('✓ Users table ready.');
    });

    // 2. Tasks table (linked to user_id via Foreign Key)
    db.run(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        completed INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `, (err) => {
      if (err) console.error('❌ Error creating tasks table:', err.message);
      else console.log('✓ Tasks table ready.');
    });
  });
}

module.exports = db;
