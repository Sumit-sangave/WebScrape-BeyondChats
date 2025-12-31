const pool = require("../db");
const Article = require("../models/articleModel");

exports.getAll = async (req, res) => {
  try {
    const data = await Article.getAll();
    res.json(data.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.getOne = async (req, res) => {
  try {
    const data = await Article.getById(req.params.id);
    res.json(data.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const data = await Article.update(req.params.id, req.body.content);
    res.json(data.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.rewriteArticle = async (req, res) => {
  try {
    await pool.query(
      "UPDATE articles SET is_updated = false WHERE id = $1",
      [req.params.id]
    );
    res.json({ message: "Rewrite triggered" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


