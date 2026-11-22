require("dotenv").config();
const express = require("express");
const cors = require("cors");
const db = require("./db");
require("./stocks"); // start price engine

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/auth", require("./routes/auth"));
app.use("/api/stocks", require("./routes/stocks"));
app.use("/api/appliances", require("./routes/appliances"));
app.use("/api/wallet", require("./routes/wallet"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/leaderboard", require("./routes/leaderboard"));

app.get("/api/health", (req, res) => res.json({ ok: true }));

// when built, serve the client from the same service (single Render Web Service option)
const path = require("path");
const fs = require("fs");
const dist = path.join(__dirname, "..", "client", "dist");
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) return next();
    res.sendFile(path.join(dist, "index.html"));
  });
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log("Mamis server on", PORT));
