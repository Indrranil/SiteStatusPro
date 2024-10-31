const express = require("express");
const router = express.Router();
const StatusController = require("../controllers/StatusController");
const { validateUrls } = require("../middleware/urlValidator"); // Import validateUrls, not urlValidator

// POST /api/v1/status/check
router.post("/check", validateUrls, async (req, res, next) => {
  try {
    const { url } = req.body;
    const status = await StatusController.checkStatus(url);
    res.json(status);
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/status/batch
router.post("/batch", validateUrls, async (req, res, next) => {
  try {
    const { urls } = req.body;
    const results = await StatusController.checkBatchStatus(urls);
    res.json(results);
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/status/:website/metrics
router.get("/:website/metrics", async (req, res, next) => {
  try {
    const { website } = req.params;
    const { period } = req.query;
    const metrics = await StatusController.getWebsiteMetrics(website, period);
    res.json(metrics);
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/status/:website/history
router.get("/:website/history", async (req, res, next) => {
  try {
    const { website } = req.params;
    const { days } = req.query;
    const history = await StatusController.getStatusHistory(website, days);
    res.json(history);
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/status/:website/summary
router.get("/:website/summary", async (req, res, next) => {
  try {
    const { website } = req.params;
    const summary = await StatusController.getStatusSummary(website);
    res.json(summary);
  } catch (error) {
    next(error);
  }
});

// Error handling middleware
router.use((err, req, res, next) => {
  console.error("Status Routes Error:", {
    path: req.path,
    method: req.method,
    error: err.message,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });

  if (err instanceof URLValidationError) {
    return res.status(400).json({
      error: "URL Validation Error",
      message: err.message,
      code: err.code,
    });
  }

  res.status(err.status || 500).json({
    error:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Internal Server Error",
    code: err.code || "INTERNAL_SERVER_ERROR",
  });
});

module.exports = router;
