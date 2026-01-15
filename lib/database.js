const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(process.cwd(), 'p2p_lending.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database');
  }
});

// Initialize tables
db.serialize(() => {
  // Users table
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    user_type TEXT DEFAULT 'individual',
    certificate_number TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Loans table
  db.run(`CREATE TABLE IF NOT EXISTS loans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lender_id INTEGER NOT NULL,
    borrower_id INTEGER,
    amount REAL NOT NULL,
    interest_rate REAL NOT NULL,
    term_months INTEGER NOT NULL,
    purpose TEXT,
    loan_type TEXT DEFAULT 'personal',
    status TEXT DEFAULT 'available',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    funded_at DATETIME,
    FOREIGN KEY (lender_id) REFERENCES users (id),
    FOREIGN KEY (borrower_id) REFERENCES users (id)
  )`);

  // Loan applications table
  db.run(`CREATE TABLE IF NOT EXISTS loan_applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    loan_id INTEGER NOT NULL,
    borrower_id INTEGER NOT NULL,
    message TEXT,
    requested_amount REAL,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (loan_id) REFERENCES loans (id),
    FOREIGN KEY (borrower_id) REFERENCES users (id)
  )`);
});

module.exports = db;