const pool = require("../db");

exports.getAll = () => {
  return pool.query("SELECT * FROM articles ORDER BY id DESC");
};

exports.getById = (id) => {
  return pool.query("SELECT * FROM articles WHERE id = $1", [id]);
};

exports.update = (id, content) => {
  return pool.query(
    "UPDATE articles SET content=$1, is_updated=true WHERE id=$2 RETURNING *",
    [content, id]
  );
};