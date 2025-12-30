const Article = require("../models/articleModel");

exports.getAll = async (req, res) => {
  const data = await Article.getAll();
  res.json(data.rows);
};

exports.getOne = async (req, res) => {
  const data = await Article.getById(req.params.id);
  res.json(data.rows[0]);
};

exports.update = async (req, res) => {
  try {
    const data = await Article.update(req.params.id, req.body.content);
    res.json(data.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};