const express = require("express");
const router = express.Router();
const PerformanceController = require("../controllers/PerformanceController");
const { validateWebsiteParam } = require("../middleware/validation");

// Get current performance metrics
router.get("/metrics/:website", validateWebsiteParam, async (req, res) => {
  await PerformanceController.getCurrentMetrics(req, res);
});

// Get historical metrics
router.get(
  "/metrics/:website/history",
  validateWebsiteParam,
  async (req, res) => {
    await PerformanceController.getMetricsHistory(req, res);
  },
);

module.exports = router;
