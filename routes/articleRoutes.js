const router = require("express").Router();
const c = require("../controllers/articleController");

router.get("/", c.getAll);
router.get("/:id", c.getOne);
router.put("/:id", c.update);

module.exports = router;
