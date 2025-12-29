const router = require("express").Router();
const c = require("../controllers/articleController");

router.get("/", c.getAll);
router.get("/:id", c.getOne);

module.exports = router;
