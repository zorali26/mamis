const express = require("express");
const db = require("../db");
const { auth, adminOnly } = require("../middleware");
const engine = require("../stocks");
const router = express.Router();

router.use(auth);
router.use(adminOnly);

const money = (v) => Math.round(Number(v) * 100) / 100;

router.get("/overview", (req, res) => {
  const users = db.prepare("SELECT COUNT(*) AS c FROM users").get().c;
  const balance = db.prepare("SELECT COALESCE(SUM(balance),0) AS s FROM users").get().s;
  const tx = db.prepare("SELECT COUNT(*) AS c FROM wallet_tx").get().c;
  const pending = db.prepare("SELECT COUNT(*) AS c FROM stock_schedule WHERE applied = 0").get().c;
  res.json({ users, balance: money(balance), transactions: tx, pendingSchedules: pending });
});

router.get("/users", (req, res) => {
  const rows = db.prepare(`
    SELECT u.id, u.username, u.email, u.balance, u.spirit, u.role, u.last_collect_at,
      (SELECT COUNT(*) FROM holdings h WHERE h.user_id = u.id) AS holdings,
      (SELECT COUNT(*) FROM wallet_tx w WHERE w.user_id = u.id) AS tx_count
    FROM users u ORDER BY u.id DESC LIMIT 200`).all();
  res.json({ users: rows });
});

router.post("/users/:id/balance", (req, res) => {
  const id = Number(req.params.id);
  const amount = money((req.body || {}).amount);
  const note = String((req.body || {}).note || "Admin işlemi");
  if (!Number.isFinite(amount) || amount === 0) return res.status(400).json({ error: "Geçersiz tutar" });
  const u = db.prepare("SELECT id FROM users WHERE id = ?").get(id);
  if (!u) return res.status(404).json({ error: "Kullanıcı yok" });
  db.prepare("UPDATE users SET balance = balance + ? WHERE id = ?").run(amount, id);
  db.prepare("INSERT INTO wallet_tx (user_id, kind, amount_mc, amount_tl, note, created_at) VALUES (?,?,?,?,?,?)")
    .run(id, amount > 0 ? "admin_add" : "admin_sub", amount, money(amount / 50), note, Date.now());
  const balance = db.prepare("SELECT balance FROM users WHERE id = ?").get(id).balance;
  res.json({ ok: true, balance });
});

router.post("/users/:id/role", (req, res) => {
  const id = Number(req.params.id);
  const role = (req.body || {}).role === "admin" ? "admin" : "user";
  db.prepare("UPDATE users SET role = ? WHERE id = ?").run(role, id);
  res.json({ ok: true, role });
});

router.get("/stocks", (req, res) => {
  const stocks = engine.STOCKS.map((s) => ({
    id: s.id, name: s.name, price: engine.prices[s.id], basePrice: s.basePrice,
    volatility: s.volatility, active: s.basePrice > 0, history: engine.history[s.id].slice(-30),
  }));
  res.json({ stocks });
});

router.post("/stocks/:id", (req, res) => {
  const s = engine.STOCKS.find((x) => x.id === req.params.id);
  if (!s) return res.status(404).json({ error: "Borsa yok" });
  const b = req.body || {};
  if (b.price !== undefined) {
    const p = money(b.price);
    if (!Number.isFinite(p) || p <= 0) return res.status(400).json({ error: "Geçersiz fiyat" });
    engine.prices[s.id] = p;
    engine.history[s.id].push(p);
  }
  if (b.volatility !== undefined) s.volatility = Math.max(0, Math.min(1, Number(b.volatility) || 0));
  if (b.active !== undefined) s.basePrice = b.active ? (money(b.basePrice) || s.basePrice || 10) : 0;
  else if (b.basePrice !== undefined) s.basePrice = money(b.basePrice);
  engine.persist();
  res.json({ ok: true, price: engine.prices[s.id], volatility: s.volatility, active: s.basePrice > 0 });
});

router.post("/stocks/:id/schedule", (req, res) => {
  const s = engine.STOCKS.find((x) => x.id === req.params.id);
  if (!s) return res.status(404).json({ error: "Borsa yok" });
  const price = money((req.body || {}).price);
  const hours = Number((req.body || {}).hours);
  if (!Number.isFinite(price) || price <= 0 || !Number.isFinite(hours) || hours <= 0) return res.status(400).json({ error: "Geçersiz plan" });
  const applyAt = Date.now() + hours * 3600000;
  db.prepare("INSERT INTO stock_schedule (stock_id, target_price, apply_at, created_by) VALUES (?,?,?,?)")
    .run(s.id, price, applyAt, req.user.id);
  res.json({ ok: true, applyAt });
});

router.get("/schedules", (req, res) => {
  const rows = db.prepare("SELECT id, stock_id, target_price, apply_at, applied FROM stock_schedule WHERE applied = 0 ORDER BY apply_at LIMIT 100").all();
  res.json({ schedules: rows });
});

router.delete("/schedules/:id", (req, res) => {
  db.prepare("DELETE FROM stock_schedule WHERE id = ?").run(Number(req.params.id));
  res.json({ ok: true });
});

router.get("/transactions", (req, res) => {
  const rows = db.prepare("SELECT w.*, u.username FROM wallet_tx w JOIN users u ON u.id = w.user_id ORDER BY w.created_at DESC LIMIT 200").all();
  res.json({ transactions: rows });
});

/* apply scheduled price changes while the server is running */
setInterval(() => {
  try {
    const due = db.prepare("SELECT * FROM stock_schedule WHERE applied = 0 AND apply_at <= ?").all(Date.now());
    for (const row of due) {
      if (engine.prices[row.stock_id] !== undefined) {
        engine.prices[row.stock_id] = money(row.target_price);
        engine.history[row.stock_id].push(engine.prices[row.stock_id]);
      }
      db.prepare("UPDATE stock_schedule SET applied = 1 WHERE id = ?").run(row.id);
    }
    if (due.length) engine.persist();
  } catch (e) {}
}, 5000);

module.exports = router;
