const express = require("express");
const db = require("../db");
const { auth } = require("../middleware");
const engine = require("../stocks");
const router = express.Router();

const DUR_MULT = { 300: 1.5, 14400: 3.0, 86400: 5.0 };

router.get("/", auth, (req, res) => {
  const list = engine.STOCKS.map((s) => ({
    id: s.id,
    name: s.name,
    price: engine.prices[s.id],
    level: engine.levelOf(engine.prices[s.id], s.basePrice),
    basePrice: s.basePrice,
    volatility: s.volatility,
    active: s.basePrice > 0,
    history: engine.history[s.id].slice(-30),
  }));
  res.json({ stocks: list });
});

router.post("/buy", auth, (req, res) => {
  const { stockId, quantity } = req.body || {};
  const stock = engine.STOCKS.find((s) => s.id === stockId);
  if (!stock) return res.status(400).json({ error: "Geçersiz borsa" });
  if (stock.basePrice <= 0) return res.status(400).json({ error: "Bu borsa henüz aktif değil" });
  const qty = Number(quantity);
  if (!qty || qty <= 0) return res.status(400).json({ error: "Geçersiz miktar" });
  const price = engine.prices[stockId];
  const cost = price * qty;
  const u = db.prepare("SELECT balance FROM users WHERE id = ?").get(req.user.id);
  if (u.balance < cost) return res.status(400).json({ error: "Yetersiz bakiye" });
  db.prepare("UPDATE users SET balance = balance - ? WHERE id = ?").run(cost, req.user.id);
  const h = db.prepare("SELECT quantity, avg_price FROM holdings WHERE user_id = ? AND stock_id = ?").get(req.user.id, stockId);
  if (h) {
    const newQty = h.quantity + qty;
    const newAvg = (h.quantity * h.avg_price + qty * price) / newQty;
    db.prepare("UPDATE holdings SET quantity = ?, avg_price = ? WHERE user_id = ? AND stock_id = ?").run(newQty, newAvg, req.user.id, stockId);
  } else {
    db.prepare("INSERT INTO holdings (user_id, stock_id, quantity, avg_price) VALUES (?,?,?,?)").run(req.user.id, stockId, qty, price);
  }
  const nb = db.prepare("SELECT balance FROM users WHERE id = ?").get(req.user.id).balance;
  try { require("./appliances").recomputeSpirit(req.user.id); } catch (e) {}
  res.json({ ok: true, balance: nb, price });
});

router.post("/sell", auth, (req, res) => {
  const { stockId, quantity } = req.body || {};
  const stock = engine.STOCKS.find((s) => s.id === stockId);
  if (!stock) return res.status(400).json({ error: "Geçersiz borsa" });
  const qty = Number(quantity);
  if (!qty || qty <= 0) return res.status(400).json({ error: "Geçersiz miktar" });
  const h = db.prepare("SELECT quantity FROM holdings WHERE user_id = ? AND stock_id = ?").get(req.user.id, stockId);
  if (!h || h.quantity < qty) return res.status(400).json({ error: "Yetersiz hisse" });
  const price = engine.prices[stockId];
  const proceeds = price * qty;
  db.prepare("UPDATE users SET balance = balance + ? WHERE id = ?").run(proceeds, req.user.id);
  const newQty = h.quantity - qty;
  if (newQty <= 0) {
    db.prepare("DELETE FROM holdings WHERE user_id = ? AND stock_id = ?").run(req.user.id, stockId);
  } else {
    db.prepare("UPDATE holdings SET quantity = ? WHERE user_id = ? AND stock_id = ?").run(newQty, req.user.id, stockId);
  }
  const nb = db.prepare("SELECT balance FROM users WHERE id = ?").get(req.user.id).balance;
  try { require("./appliances").recomputeSpirit(req.user.id); } catch (e) {}
  res.json({ ok: true, balance: nb, price });
});

router.post("/predict", auth, (req, res) => {
  const { stockId, kind, target, bet, duration } = req.body || {};
  const stock = engine.STOCKS.find((s) => s.id === stockId);
  if (!stock) return res.status(400).json({ error: "Geçersiz borsa" });
  if (!["above", "below"].includes(kind)) return res.status(400).json({ error: "Geçersiz tahmin türü" });
  const tgt = Number(target);
  if (!tgt || tgt <= 0) return res.status(400).json({ error: "Geçersiz hedef fiyat" });
  const betAmt = Number(bet);
  if (!betAmt || betAmt < 10) return res.status(400).json({ error: "Minimum bahis 10" });
  const dur = Number(duration);
  if (!DUR_MULT[dur]) return res.status(400).json({ error: "Geçersiz süre" });
  const u = db.prepare("SELECT balance FROM users WHERE id = ?").get(req.user.id);
  if (u.balance < betAmt) return res.status(400).json({ error: "Yetersiz bakiye" });

  const mult = DUR_MULT[dur];
  db.prepare("UPDATE users SET balance = balance - ? WHERE id = ?").run(betAmt, req.user.id);
  const now = Date.now();
  const resolves = now + dur * 1000;
  db.prepare(`INSERT INTO predictions (user_id, stock_id, kind, target, bet, multiplier, created_at, resolves_at) VALUES (?,?,?,?,?,?,?,?)`)
    .run(req.user.id, stockId, kind, tgt, betAmt, mult, now, resolves);
  const nb = db.prepare("SELECT balance FROM users WHERE id = ?").get(req.user.id).balance;
  res.json({ ok: true, balance: nb, resolvesAt: resolves, multiplier: mult });
});

router.get("/predictions", auth, (req, res) => {
  const rows = db.prepare("SELECT * FROM predictions WHERE user_id = ? ORDER BY created_at DESC LIMIT 50").all(req.user.id);
  res.json({ predictions: rows });
});

router.get("/portfolio", auth, (req, res) => {
  const holdings = db.prepare("SELECT stock_id, quantity, avg_price FROM holdings WHERE user_id = ?").all(req.user.id);
  const enriched = holdings.map((h) => {
    const price = engine.prices[h.stock_id];
    const stock = engine.STOCKS.find((s) => s.id === h.stock_id);
    return {
      stockId: h.stock_id,
      name: stock.name,
      quantity: h.quantity,
      avgPrice: h.avg_price,
      price,
      value: price * h.quantity,
      pnl: (price - h.avg_price) * h.quantity,
    };
  });
  const u = db.prepare("SELECT balance FROM users WHERE id = ?").get(req.user.id);
  res.json({ holdings: enriched, balance: u.balance });
});

module.exports = router;
module.exports.DUR_MULT = DUR_MULT;
