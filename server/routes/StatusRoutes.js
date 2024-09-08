// fsd/server/routes/StatusRoutes.js
const express = require("express");
const { checkStatus } = require("../controllers/StatusController");
const { getCurrentOutages } = require("../controllers/OutageController"); // Import the function
const router = express.Router();

router.post("/", checkStatus);
router.get("/outages", getCurrentOutages); // Now it should work

module.exports = router;
