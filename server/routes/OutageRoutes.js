const express = require("express");
const {
  getCurrentOutages,
  getRecentOutages,
  getOutageDetails,
} = require("../controllers/OutageController");

console.log("getCurrentOutages:", getCurrentOutages);
console.log("getRecentOutages:", getRecentOutages);
console.log("getOutageDetails:", getOutageDetails);

const router = express.Router();

router.get("/outages", getCurrentOutages);
router.get("/recent", getRecentOutages);
router.get("/:website", getOutageDetails);

module.exports = router;

console.log(module.exports);
