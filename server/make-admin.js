// Usage: node make-admin.js user@example.com
const db = require("./db");
const email = process.argv[2];
if (!email) {
  console.error("Kullanım: node make-admin.js <email>");
  process.exit(1);
}
const u = db.prepare("SELECT id, username FROM users WHERE email = ?").get(email);
if (!u) {
  console.error("Kullanıcı bulunamadı:", email);
  process.exit(1);
}
db.prepare("UPDATE users SET role = 'admin' WHERE id = ?").run(u.id);
console.log("Admin yetkisi verildi:", u.username, email);
