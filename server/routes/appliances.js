const express = require("express");
const db = require("../db");
const { auth } = require("../middleware");
const router = express.Router();

const APPLIANCES = [
  { id: "house", name: "Ev", baseCost: 400, baseIncome: 10, maxLevel: 3, spiritBase: 10 },
  { id: "fridge", name: "Buzdolabı", baseCost: 500, baseIncome: 12, maxLevel: 3, spiritBase: 0 },
  { id: "washer", name: "Çamaşır Makinesi", baseCost: 800, baseIncome: 20, maxLevel: 3, spiritBase: 0 },
  { id: "dishwasher", name: "Bulaşık Makinesi", baseCost: 600, baseIncome: 15, maxLevel: 3, spiritBase: 0 },
  { id: "tv", name: "Televizyon", baseCost: 400, baseIncome: 8, maxLevel: 3, spiritBase: 0 },
  { id: "ac", name: "Klima", baseCost: 1200, baseIncome: 30, maxLevel: 3, spiritBase: 0 },
  { id: "microwave", name: "Mikrodalga", baseCost: 300, baseIncome: 6, maxLevel: 3, spiritBase: 0 },
  { id: "oven", name: "Fırın", baseCost: 700, baseIncome: 16, maxLevel: 3, spiritBase: 0 },
  { id: "vacuum", name: "Elektrik Süpürgesi", baseCost: 350, baseIncome: 7, maxLevel: 3, spiritBase: 0 },
  { id: "iron", name: "Ütü", baseCost: 250, baseIncome: 5, maxLevel: 3, spiritBase: 0 },
  { id: "hairdryer", name: "Saç Kurutma Makinesi", baseCost: 200, baseIncome: 4, maxLevel: 3, spiritBase: 0 },
];

function levelCost(base, level) { return Math.round(base * Math.pow(1.6, level)); }
function levelIncome(base, level) { return Math.round(base * Math.pow(1.5, level) * 10) / 10; }

function ensureRows(userId) {
  const stmt = db.prepare("INSERT OR IGNORE INTO appliances (user_id, appliance_id, level, owned) VALUES (?,?,0,0)");
  APPLIANCES.forEach((a) => stmt.run(userId, a.id));
}

function computeSpirit(userId) {
  ensureRows(userId);
  const rows = db.prepare("SELECT appliance_id, level, owned FROM appliances WHERE user_id = ?").all(userId);
  let spirit = 0;
  for (const r of rows) {
    if (!r.owned || r.level <= 0) continue;
    const def = APPLIANCES.find((a) => a.id === r.appliance_id);
    spirit += (def && def.spiritBase ? def.spiritBase : 0) + r.level * 5;
  }
  // portfolio contribution (decimal)
  try {
    const holdings = db.prepare("SELECT stock_id, quantity FROM holdings WHERE user_id = ?").all(userId);
    const engine = require("../stocks");
    let pv = 0;
    for (const h of holdings) {
      pv += h.quantity * (engine.prices[h.stock_id] || 0);
    }
    spirit += pv / 100;
  } catch (e) {}
  return Math.round(spirit * 100) / 100;
}

function recomputeSpirit(userId) {
  const s = computeSpirit(userId);
  db.prepare("UPDATE users SET spirit = ? WHERE id = ?").run(s, userId);
  return s;
}

function collectIncome(userId) {
  ensureRows(userId);
  const u = db.prepare("SELECT last_collect_at, balance FROM users WHERE id = ?").get(userId);
  const now = Date.now();
  const hours = (now - u.last_collect_at) / 3600000;
  const rows = db.prepare("SELECT appliance_id, level, owned FROM appliances WHERE user_id = ?").all(userId);
  let earned = 0;
  for (const r of rows) {
    if (!r.owned || r.level <= 0) continue;
    const def = APPLIANCES.find((a) => a.id === r.appliance_id);
    earned += levelIncome(def.baseIncome, r.level - 1) * hours;
  }
  const newBalance = u.balance + earned;
  db.prepare("UPDATE users SET balance = ?, last_collect_at = ? WHERE id = ?").run(newBalance, now, userId);
  return { earned, balance: newBalance };
}

/* saved Clash-of-Clans style appliance positions */
router.get("/layout", auth, (req, res) => {
  const rows = db.prepare("SELECT appliance_id, x, z FROM appliance_layouts WHERE user_id = ?").all(req.user.id);
  const layout = {};
  rows.forEach((r) => { layout[r.appliance_id] = { x: r.x, z: r.z }; });
  res.json({ layout });
});

router.put("/layout", auth, (req, res) => {
  const layout = (req.body && req.body.layout) || {};
  const valid = new Set(APPLIANCES.map((a) => a.id));
  const stmt = db.prepare("INSERT OR REPLACE INTO appliance_layouts (user_id, appliance_id, x, z) VALUES (?,?,?,?)");
  for (const [id, p] of Object.entries(layout)) {
    if (!valid.has(id) || !p || !Number.isFinite(p.x) || !Number.isFinite(p.z)) continue;
    stmt.run(req.user.id, id, Math.max(0, Math.min(16, p.x)), Math.max(0, Math.min(12, p.z)));
  }
  res.json({ ok: true });
});

router.get("/", auth, (req, res) => {
  ensureRows(req.user.id);
  collectIncome(req.user.id);
  const spirit = computeSpirit(req.user.id);
  recomputeSpirit(req.user.id);
  const rows = db.prepare("SELECT appliance_id, level, owned FROM appliances WHERE user_id = ?").all(req.user.id);
  const u = db.prepare("SELECT balance FROM users WHERE id = ?").get(req.user.id);
  res.json({ appliances: rows.map((r) => ({ id: r.appliance_id, level: r.level, owned: !!r.owned })), balance: u.balance, spirit, defs: APPLIANCES });
});

router.post("/buy", auth, (req, res) => {
  const { id } = req.body || {};
  const def = APPLIANCES.find((a) => a.id === id);
  if (!def) return res.status(400).json({ error: "Geçersiz alet" });
  ensureRows(req.user.id);
  collectIncome(req.user.id);
  const row = db.prepare("SELECT level, owned FROM appliances WHERE user_id = ? AND appliance_id = ?").get(req.user.id, id);
  if (row.owned) return res.status(400).json({ error: "Zaten sahipsin" });
  const u = db.prepare("SELECT balance FROM users WHERE id = ?").get(req.user.id);
  if (u.balance < def.baseCost) return res.status(400).json({ error: "Yetersiz bakiye" });
  db.prepare("UPDATE users SET balance = balance - ? WHERE id = ?").run(def.baseCost, req.user.id);
  db.prepare("UPDATE appliances SET owned = 1, level = 1 WHERE user_id = ? AND appliance_id = ?").run(req.user.id, id);
  const spirit = recomputeSpirit(req.user.id);
  const nb = db.prepare("SELECT balance FROM users WHERE id = ?").get(req.user.id).balance;
  res.json({ ok: true, balance: nb, spirit });
});

router.post("/upgrade", auth, (req, res) => {
  const { id } = req.body || {};
  const def = APPLIANCES.find((a) => a.id === id);
  if (!def) return res.status(400).json({ error: "Geçersiz alet" });
  ensureRows(req.user.id);
  collectIncome(req.user.id);
  const row = db.prepare("SELECT level, owned FROM appliances WHERE user_id = ? AND appliance_id = ?").get(req.user.id, id);
  if (!row.owned) return res.status(400).json({ error: "Önce satın al" });
  if (row.level >= def.maxLevel) return res.status(400).json({ error: "Max seviye" });
  const cost = levelCost(def.baseCost, row.level);
  const u = db.prepare("SELECT balance FROM users WHERE id = ?").get(req.user.id);
  if (u.balance < cost) return res.status(400).json({ error: "Yetersiz bakiye" });
  db.prepare("UPDATE users SET balance = balance - ? WHERE id = ?").run(cost, req.user.id);
  db.prepare("UPDATE appliances SET level = level + 1 WHERE user_id = ? AND appliance_id = ?").run(req.user.id, id);
  const spirit = recomputeSpirit(req.user.id);
  const nb = db.prepare("SELECT balance FROM users WHERE id = ?").get(req.user.id).balance;
  const newRow = db.prepare("SELECT level FROM appliances WHERE user_id = ? AND appliance_id = ?").get(req.user.id, id);
  res.json({ ok: true, level: newRow.level, balance: nb, cost, spirit });
});

router.post("/collect", auth, (req, res) => {
  const r = collectIncome(req.user.id);
  const spirit = recomputeSpirit(req.user.id);
  res.json({ ...r, spirit });
});

module.exports = router;
module.exports.APPLIANCES = APPLIANCES;
module.exports.levelCost = levelCost;
module.exports.levelIncome = levelIncome;
module.exports.collectIncome = collectIncome;
module.exports.ensureRows = ensureRows;
module.exports.recomputeSpirit = recomputeSpirit;
module.exports.computeSpirit = computeSpirit;
