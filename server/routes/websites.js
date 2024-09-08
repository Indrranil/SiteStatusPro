// fsd/server/routes/websites.js
const express = require("express");
const router = express.Router();
const websitesToMonitor = require("../config/websitesToMonitor");

// GET /api/websites - Get the list of monitored websites
router.get("/websites", (req, res) => {
  res.json(websitesToMonitor);
});

module.exports = router;
