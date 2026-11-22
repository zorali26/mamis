const express = require("express");
const db = require("../db");
const { auth } = require("../middleware");
const router = express.Router();

const RATE = 50; // 50 MC = 1 TL
const MIN_DEPOSIT_TL = 20;
const MIN_WITHDRAW_TL = 50;

function logTx(userId, kind, mc, tl, note) {
  db.prepare("INSERT INTO wallet_tx (user_id, kind, amount_mc, amount_tl, note, created_at) VALUES (?,?,?,?,?,?)")
    .run(userId, kind, mc, tl, note || "", Date.now());
}

router.get("/summary", auth, (req, res) => {
  const u = db.prepare("SELECT balance FROM users WHERE id = ?").get(req.user.id);
  const tx = db.prepare("SELECT kind, amount_mc, amount_tl, note, created_at FROM wallet_tx WHERE user_id = ? ORDER BY created_at DESC LIMIT 50").all(req.user.id);
  res.json({ balance: u.balance, rate: RATE, tl: Math.floor(u.balance / RATE * 100) / 100, minDeposit: MIN_DEPOSIT_TL, minWithdraw: MIN_WITHDRAW_TL, history: tx });
});

router.post("/deposit", auth, (req, res) => {
  const tl = Number((req.body || {}).tl);
  if (!Number.isFinite(tl) || tl < MIN_DEPOSIT_TL) return res.status(400).json({ error: `Minimum yatırım ${MIN_DEPOSIT_TL} TL` });
  const mc = Math.round(tl * RATE * 100) / 100;
  db.prepare("UPDATE users SET balance = balance + ? WHERE id = ?").run(mc, req.user.id);
  logTx(req.user.id, "deposit", mc, tl, "TL yatırımı");
  const balance = db.prepare("SELECT balance FROM users WHERE id = ?").get(req.user.id).balance;
  res.json({ ok: true, balance, added: mc });
});

router.post("/withdraw", auth, (req, res) => {
  const tl = Number((req.body || {}).tl);
  if (!Number.isFinite(tl) || tl < MIN_WITHDRAW_TL) return res.status(400).json({ error: `Minimum çekim ${MIN_WITHDRAW_TL} TL` });
  const mc = Math.round(tl * RATE * 100) / 100;
  const u = db.prepare("SELECT balance FROM users WHERE id = ?").get(req.user.id);
  if (u.balance < mc) return res.status(400).json({ error: "Yetersiz MC bakiyesi" });
  db.prepare("UPDATE users SET balance = balance - ? WHERE id = ?").run(mc, req.user.id);
  logTx(req.user.id, "withdraw", -mc, tl, "TL çekimi");
  const balance = db.prepare("SELECT balance FROM users WHERE id = ?").get(req.user.id).balance;
  res.json({ ok: true, balance, withdrawn: mc });
});

router.get("/history", auth, (req, res) => {
  const tx = db.prepare("SELECT kind, amount_mc, amount_tl, note, created_at FROM wallet_tx WHERE user_id = ? ORDER BY created_at DESC LIMIT 100").all(req.user.id);
  res.json({ history: tx });
});

module.exports = router;
module.exports.RATE = RATE;
