const express = require("express");
const router = express.Router();
const SSLController = require("../controllers/SSLController");

// Get current SSL status for a website
router.get("/:website/status", function (req, res) {
  SSLController.getSSLStatus(req, res);
});

// Get SSL certificate history
router.get("/:website/history", function (req, res) {
  SSLController.getSSLHistory(req, res);
});

// Trigger manual SSL check
router.post("/:website/check", function (req, res) {
  SSLController.triggerSSLCheck(req, res);
});

module.exports = router;
