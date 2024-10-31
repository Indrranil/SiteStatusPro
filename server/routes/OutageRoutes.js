const express = require("express");
const router = express.Router();
const OutageController = require("../controllers/OutageController");

// GET /api/v1/outages/current
router.get("/current", async (req, res) => {
  try {
    const outages = await OutageController.getCurrentOutages();
    res.json(outages);
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch current outages",
      message: error.message,
    });
  }
});

// GET /api/v1/outages/recent
router.get("/recent", async (req, res) => {
  try {
    const { page, limit } = req.query;
    const recentOutages = await OutageController.getRecentOutages(
      parseInt(page) || 1,
      parseInt(limit) || 10,
    );
    res.json(recentOutages);
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch recent outages",
      message: error.message,
    });
  }
});

// GET /api/v1/outages/:id
router.get("/:id", async (req, res) => {
  try {
    const outage = await OutageController.getOutageDetails(req.params.id);
    if (!outage) {
      return res.status(404).json({
        error: "Not Found",
        message: "Outage not found",
      });
    }
    res.json(outage);
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch outage details",
      message: error.message,
    });
  }
});

// GET /api/v1/outages/website/:website
router.get("/website/:website", async (req, res) => {
  try {
    const outages = await OutageController.getWebsiteOutages(
      req.params.website,
    );
    res.json(outages);
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch website outages",
      message: error.message,
    });
  }
});

// GET /api/v1/outages/stats/:website
router.get("/stats/:website", async (req, res) => {
  try {
    const stats = await OutageController.getOutageStats(
      req.params.website,
      req.query.period,
    );
    res.json(stats);
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch outage statistics",
      message: error.message,
    });
  }
});

module.exports = router;
