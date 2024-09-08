// fsd/server/routes/ReportRoutes.js
// server/routes/ReportRoutes.js
const express = require("express");
const router = express.Router();
const ReportController = require("../controllers/ReportController");

router.get("/reports/:website", ReportController.getReportsForWebsite);

module.exports = router;
