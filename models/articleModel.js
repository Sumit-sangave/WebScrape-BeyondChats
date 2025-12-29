const pool = require("../db");

exports.getAll = () => pool.query("SELECT * FROM articles");
exports.getById = (id) =>
  pool.query("SELECT * FROM articles WHERE id=$1", [id]);
exports.update = (id, content) =>
  pool.query(
    "UPDATE articles SET content=$1, is_updated=true WHERE id=$2",
    [content, id]
  );
