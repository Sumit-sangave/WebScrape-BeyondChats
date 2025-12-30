require("dotenv").config();
const express = require("express");
const cors = require("cors");

const articlesRoutes = require("./routes/articleRoutes");

const app = express();

// 🔴 REQUIRED middleware
app.use(cors());
app.use(express.json()); // ← THIS IS CRITICAL

// 🔴 REQUIRED route mounting
app.use("/api/articles", articlesRoutes);

// Optional test route
app.get("/", (req, res) => {
  res.send("API is running");
});

module.exports = app;
