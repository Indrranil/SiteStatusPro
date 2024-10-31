const express = require("express");
const router = express.Router();
const { subscribe } = require("../controllers/NotificationController");

// Route to subscribe for notifications
router.post("/subscribe", subscribe);

module.exports = router;
