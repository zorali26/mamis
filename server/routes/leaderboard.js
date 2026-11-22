const express = require("express");
const db = require("../db");
const { auth } = require("../middleware");
const router = express.Router();

router.get("/", auth, (req, res) => {
  const users = db.prepare("SELECT id, username, balance FROM users").all();
  const appl = require("./appliances");
  const list = users.map((u) => ({
    username: u.username,
    balance: u.balance,
    spirit: appl.computeSpirit(u.id),
  })).sort((a, b) => b.spirit - a.spirit || b.balance - a.balance).slice(0, 20);
  res.json({ leaderboard: list.map((r, i) => ({ rank: i + 1, username: r.username, balance: r.balance, spirit: r.spirit })) });
});

module.exports = router;
