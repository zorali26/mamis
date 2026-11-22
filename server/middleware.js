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

module.exports = { auth, JWT_SECRET };
