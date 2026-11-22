const db = require("./db");

const STOCKS = [
  { id: "mamisg1", name: "MamisG1", volatility: 0.08, basePrice: 10 },
  { id: "mamisg2", name: "MamisG2", volatility: 0.0, basePrice: 0 },
  { id: "mamisg3", name: "MamisG3", volatility: 0.0, basePrice: 0 },
  { id: "taliong8", name: "TalionG8", volatility: 0.0, basePrice: 0 },
  { id: "taliong4", name: "TalionG4", volatility: 0.0, basePrice: 0 },
  { id: "zaloxc1", name: "ZaloxC1", volatility: 0.0, basePrice: 0 },
  { id: "zaloxc3", name: "ZaloxC3", volatility: 0.0, basePrice: 0 },
  { id: "optimusd1", name: "OptimusD1", volatility: 0.0, basePrice: 0 },
];

const prices = {};
const history = {};
STOCKS.forEach((s) => {
  prices[s.id] = s.basePrice;
  history[s.id] = [s.basePrice];
});

try {
  const rows = db.prepare("SELECT stock_id, price FROM stock_prices").all();
  rows.forEach((r) => {
    if (prices[r.stock_id] !== undefined) prices[r.stock_id] = r.price;
  });
} catch (e) {}

function persist() {
  const stmt = db.prepare("INSERT INTO stock_prices (stock_id, price, updated_at) VALUES (?, ?, ?) ON CONFLICT(stock_id) DO UPDATE SET price=excluded.price, updated_at=excluded.updated_at");
  const now = Date.now();
  STOCKS.forEach((s) => stmt.run(s.id, prices[s.id], now));
}

function levelOf(price, base) {
  if (!base || base <= 0) return 1;
  const ratio = price / base;
  if (ratio < 0.5) return 1;
  if (ratio < 0.8) return 2;
  if (ratio < 1.1) return 3;
  if (ratio < 1.4) return 4;
  if (ratio < 1.8) return 5;
  if (ratio < 2.3) return 6;
  if (ratio < 3.0) return 7;
  if (ratio < 4.0) return 8;
  if (ratio < 5.5) return 9;
  return 10;
}

function tick() {
  STOCKS.forEach((s) => {
    if (s.basePrice <= 0) return; // inactive
    const v = s.volatility;
    const change = (Math.random() * 2 - 1) * v;
    let p = prices[s.id] * (1 + change);
    if (p < 0.01) p = 0.01;
    prices[s.id] = Math.round(p * 100) / 100;
    const h = history[s.id];
    h.push(prices[s.id]);
    if (h.length > 60) h.shift();
  });
  persist();
  resolvePredictions();
}

function resolvePredictions() {
  const now = Date.now();
  const pending = db.prepare("SELECT * FROM predictions WHERE resolved = 0 AND resolves_at <= ?").all(now);
  for (const pr of pending) {
    const price = prices[pr.stock_id];
    let win = false;
    if (pr.kind === "above" && price >= pr.target) win = true;
    if (pr.kind === "below" && price <= pr.target) win = true;
    const payout = win ? pr.bet * pr.multiplier : 0;
    db.prepare("UPDATE predictions SET resolved=1, outcome=?, payout=? WHERE id=?").run(win ? "win" : "lose", payout, pr.id);
    if (win) {
      db.prepare("UPDATE users SET balance = balance + ? WHERE id = ?").run(payout, pr.user_id);
    }
  }
}

setInterval(tick, 5000);

module.exports = { STOCKS, prices, history, levelOf, tick, persist };
