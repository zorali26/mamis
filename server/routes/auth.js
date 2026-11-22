const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db");
const { auth, JWT_SECRET } = require("../middleware");
const router = express.Router();

router.post("/register", (req, res) => {
  const { username, email, password } = req.body || {};
  if (!username || !email || !password) return res.status(400).json({ error: "Tüm alanlar gerekli" });
  if (password.length < 4) return res.status(400).json({ error: "Şifre en az 4 karakter" });
  const hash = bcrypt.hashSync(password, 10);
  const now = Date.now();
  try {
    const info = db.prepare("INSERT INTO users (username, email, password_hash, balance, spirit, tutorial_done, tutorial_step, created_at, last_collect_at) VALUES (?,?,?,?,0,0,0,?,?)").run(username, email, hash, 500, now, now);
    const user = { id: info.lastInsertRowid, username, email, balance: 500, spirit: 0, tutorialDone: false, tutorialStep: 0 };
    const token = jwt.sign({ id: user.id, username }, JWT_SECRET, { expiresIn: "30d" });
    res.json({ token, user });
  } catch (e) {
    if (String(e).includes("UNIQUE")) return res.status(409).json({ error: "Kullanıcı veya e-posta zaten var" });
    res.status(500).json({ error: "Kayıt hatası" });
  }
});

router.post("/login", (req, res) => {
  const { email, password } = req.body || {};
  const u = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
  if (!u) return res.status(401).json({ error: "Geçersiz bilgiler" });
  if (!bcrypt.compareSync(password, u.password_hash)) return res.status(401).json({ error: "Geçersiz bilgiler" });
  const user = { id: u.id, username: u.username, email: u.email, balance: u.balance, spirit: u.spirit, tutorialDone: !!u.tutorial_done, tutorialStep: u.tutorial_step };
  const token = jwt.sign({ id: u.id, username: u.username }, JWT_SECRET, { expiresIn: "30d" });
  res.json({ token, user });
});

router.get("/me", auth, (req, res) => {
  try { require("./appliances").collectIncome(req.user.id); } catch (e) {}
  const u = db.prepare("SELECT id, username, email, balance, tutorial_done, tutorial_step FROM users WHERE id = ?").get(req.user.id);
  if (!u) return res.status(404).json({ error: "Bulunamadı" });
  const spirit = require("./appliances").computeSpirit(req.user.id);
  db.prepare("UPDATE users SET spirit = ? WHERE id = ?").run(spirit, req.user.id);
  res.json({ user: { id: u.id, username: u.username, email: u.email, balance: u.balance, spirit, tutorialDone: !!u.tutorial_done, tutorialStep: u.tutorial_step } });
});

router.put("/tutorial", auth, (req, res) => {
  db.prepare("UPDATE users SET tutorial_done = 1, tutorial_step = 99 WHERE id = ?").run(req.user.id);
  res.json({ ok: true });
});

router.post("/tutorial/complete", auth, (req, res) => {
  // grant house if not owned
  const has = db.prepare("SELECT owned FROM appliances WHERE user_id = ? AND appliance_id = ?").get(req.user.id, "house");
  if (!has || !has.owned) {
    db.prepare("INSERT OR IGNORE INTO appliances (user_id, appliance_id, level, owned) VALUES (?,?,1,1)").run(req.user.id, "house");
    db.prepare("UPDATE appliances SET owned=1, level=1 WHERE user_id=? AND appliance_id=?").run(req.user.id, "house");
  }
  // set balance to 1000 and spirit
  db.prepare("UPDATE users SET balance = 1000, tutorial_done = 0, tutorial_step = 3 WHERE id = ?").run(req.user.id);
  const spirit = require("./appliances").computeSpirit(req.user.id);
  db.prepare("UPDATE users SET spirit = ? WHERE id = ?").run(spirit, req.user.id);
  const u = db.prepare("SELECT id, username, email, balance, tutorial_done, tutorial_step FROM users WHERE id = ?").get(req.user.id);
  res.json({ user: { id: u.id, username: u.username, email: u.email, balance: u.balance, spirit, tutorialDone: !!u.tutorial_done, tutorialStep: u.tutorial_step } });
});

module.exports = router;
