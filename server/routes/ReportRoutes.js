// fsd/server/routes/ReportRoutes.js
const express = require("express");
const { reportIssue, getReports } = require("../controllers/ReportController");
const router = express.Router();

router.post("/", reportIssue);
router.get("/", getReports);

module.exports = router;
