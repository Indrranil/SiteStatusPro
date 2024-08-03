// server/routes/OutageRoutes.js
const express = require("express");
const {
  getCurrentOutages,
  getRecentOutages,
  getOutageDetails,
} = require("../controllers/OutageController");

const router = express.Router();

router.get("/current", getCurrentOutages);
router.get("/recent", getRecentOutages);
router.get("/:website", getOutageDetails);

module.exports = router;
