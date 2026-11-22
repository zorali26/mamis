const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "mamis-dev-secret-change-me";

function auth(req, res, next) {
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Giriş gerekli" });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (e) {
    return res.status(401).json({ error: "Geçersiz token" });
  }
}

function adminOnly(req, res, next) {
  let role = req.user.role;
  if (role !== "admin") {
    try { role = require("./db").prepare("SELECT role FROM users WHERE id = ?").get(req.user.id)?.role; } catch (e) {}
  }
  if (role !== "admin") return res.status(403).json({ error: "Admin yetkisi gerekli" });
  next();
}

module.exports = { auth, adminOnly, JWT_SECRET };
