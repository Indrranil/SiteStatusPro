// fsd/server/routes/statusRoutes.js
const express = require("express");
const { checkStatus } = require("../controllers/StatusController");
const router = express.Router();

router.post("/status", checkStatus);

module.exports = router;
