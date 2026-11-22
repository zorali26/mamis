const { DatabaseSync } = require("node:sqlite");
const path = require("path");

const dbPath = path.join(__dirname, "mamis.db");
const db = new DatabaseSync(dbPath);

db.exec(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    balance REAL NOT NULL DEFAULT 500,
    spirit INTEGER NOT NULL DEFAULT 0,
    tutorial_done INTEGER NOT NULL DEFAULT 0,
    tutorial_step INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    last_collect_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS holdings (
    user_id INTEGER NOT NULL,
    stock_id TEXT NOT NULL,
    quantity REAL NOT NULL DEFAULT 0,
    avg_price REAL NOT NULL DEFAULT 0,
    PRIMARY KEY (user_id, stock_id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
  CREATE TABLE IF NOT EXISTS appliances (
    user_id INTEGER NOT NULL,
    appliance_id TEXT NOT NULL,
    level INTEGER NOT NULL DEFAULT 0,
    owned INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (user_id, appliance_id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
  CREATE TABLE IF NOT EXISTS appliance_layouts (
    user_id INTEGER NOT NULL,
    appliance_id TEXT NOT NULL,
    x REAL NOT NULL,
    z REAL NOT NULL,
    PRIMARY KEY (user_id, appliance_id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
  CREATE TABLE IF NOT EXISTS wallet_tx (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    kind TEXT NOT NULL,
    amount_mc REAL NOT NULL,
    amount_tl REAL NOT NULL,
    note TEXT,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS stock_schedule (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    stock_id TEXT NOT NULL,
    target_price REAL NOT NULL,
    apply_at INTEGER NOT NULL,
    created_by INTEGER,
    applied INTEGER NOT NULL DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS predictions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    stock_id TEXT NOT NULL,
    kind TEXT NOT NULL,
    target REAL NOT NULL,
    bet REAL NOT NULL,
    multiplier REAL NOT NULL,
    created_at INTEGER NOT NULL,
    resolves_at INTEGER NOT NULL,
    resolved INTEGER NOT NULL DEFAULT 0,
    outcome TEXT,
    payout REAL,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
  CREATE TABLE IF NOT EXISTS stock_prices (
    stock_id TEXT PRIMARY KEY,
    price REAL NOT NULL,
    updated_at INTEGER NOT NULL
  );
`);

// migrate older db: add columns if missing
function addCol(table, col, def) {
  try { db.exec(`ALTER TABLE ${table} ADD COLUMN ${col} ${def}`); } catch (e) {}
}
addCol("users", "spirit", "INTEGER NOT NULL DEFAULT 0");
addCol("users", "tutorial_step", "INTEGER NOT NULL DEFAULT 0");
addCol("users", "role", "TEXT NOT NULL DEFAULT 'user'");
// default balance for new users handled in code; ensure column default
module.exports = db;
