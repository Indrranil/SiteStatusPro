const express = require("express");
const router = express.Router();
const ReportController = require("../controllers/ReportController");

/**
 * @route POST /api/reports
 * @desc Submit a new issue report for a website
 * @access Public
 */
router.post("/", ReportController.reportIssue);

/**
 * @route GET /api/reports/:website
 * @desc Get recent reports and analytics for a specific website
 * @access Public
 */
router.get("/:website", ReportController.getReportsForWebsite);

/**
 * @route GET /api/reports/:website/historical
 * @desc Get historical report data and trends
 * @access Public
 * @param {number} days - Number of days of historical data (default: 30)
 */
router.get("/:website/historical", ReportController.getHistoricalReports);

/**
 * @route GET /api/reports/:website/analytics
 * @desc Get detailed analytics including peak hours, common issues, and trends
 * @access Public
 */
router.get("/:website/analytics", async (req, res) => {
  try {
    const { website } = req.params;
    const { startDate, endDate } = req.query;

    // Convert dates if provided
    const start = startDate
      ? new Date(startDate)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    // Get aggregated analytics
    const analytics = await ReportController.getWebsiteAnalytics(
      website,
      start,
      end,
    );
    res.json(analytics);
  } catch (error) {
    console.error("Error fetching analytics:", error);
    res.status(500).json({ message: "Failed to fetch analytics" });
  }
});

/**
 * @route GET /api/reports/:website/peak-times
 * @desc Get peak problem reporting times
 * @access Public
 */
router.get("/:website/peak-times", async (req, res) => {
  try {
    const { website } = req.params;
    const { days = 7 } = req.query;

    const peakTimes = await ReportController.getWebsitePeakTimes(
      website,
      parseInt(days),
    );
    res.json(peakTimes);
  } catch (error) {
    console.error("Error fetching peak times:", error);
    res.status(500).json({ message: "Failed to fetch peak times" });
  }
});

/**
 * @route GET /api/reports/:website/compare
 * @desc Compare issue patterns between two time periods
 * @access Public
 */
router.get("/:website/compare", async (req, res) => {
  try {
    const { website } = req.params;
    const { period1Start, period1End, period2Start, period2End } = req.query;

    if (!period1Start || !period1End || !period2Start || !period2End) {
      return res
        .status(400)
        .json({ message: "Missing required date parameters" });
    }

    const comparison = await ReportController.compareTimePeriods(
      website,
      new Date(period1Start),
      new Date(period1End),
      new Date(period2Start),
      new Date(period2End),
    );
    res.json(comparison);
  } catch (error) {
    console.error("Error comparing time periods:", error);
    res.status(500).json({ message: "Failed to compare time periods" });
  }
});

/**
 * @route DELETE /api/reports/:website
 * @desc Delete old reports (admin only)
 * @access Private
 */
router.delete("/:website", async (req, res) => {
  try {
    const { website } = req.params;
    const { olderThan } = req.query; // Date in ISO format

    if (!olderThan) {
      return res.status(400).json({ message: "Missing olderThan parameter" });
    }

    const result = await ReportController.deleteOldReports(
      website,
      new Date(olderThan),
    );
    res.json(result);
  } catch (error) {
    console.error("Error deleting old reports:", error);
    res.status(500).json({ message: "Failed to delete old reports" });
  }
});

/**
 * @route GET /api/reports/:website/export
 * @desc Export report data in CSV format
 * @access Public
 */
router.get("/:website/export", async (req, res) => {
  try {
    const { website } = req.params;
    const { startDate, endDate, format = "csv" } = req.query;

    const exportData = await ReportController.exportReports(
      website,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
      format,
    );

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${website}-reports.${format}`,
    );
    res.send(exportData);
  } catch (error) {
    console.error("Error exporting reports:", error);
    res.status(500).json({ message: "Failed to export reports" });
  }
});

// Error handling middleware specific to reports
router.use((err, req, res, next) => {
  console.error("Report Route Error:", err);
  res.status(500).json({
    message: "An error occurred processing the report request",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

module.exports = router;
