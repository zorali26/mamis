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
app.use("/api/leaderboard", require("./routes/leaderboard"));

app.get("/api/health", (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log("Mamis server on", PORT));
