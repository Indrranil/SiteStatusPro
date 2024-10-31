const express = require("express");
const router = express.Router();
const websitesToMonitor = require("../config/websitesToMonitor");
const StatusController = require("../controllers/StatusController");

// Middleware to check if website exists
const validateWebsite = (req, res, next) => {
  const { website } = req.params;
  const websiteInfo = websitesToMonitor.find(
    (site) => site.name.toLowerCase() === website.toLowerCase(),
  );

  if (!websiteInfo) {
    return res.status(404).json({
      error: "Not Found",
      message: `Website '${website}' is not in our monitoring list`,
    });
  }

  req.websiteInfo = websiteInfo; // Pass the website info to the next middleware
  next();
};

// GET /api/v1/websites - Get all websites with their status
router.get("/", async (req, res) => {
  try {
    // Return the basic list without status for now
    res.json(websitesToMonitor);
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch websites",
      message: error.message,
    });
  }
});

// GET /api/v1/websites/:website/details
router.get("/:website/details", validateWebsite, async (req, res) => {
  try {
    const details = await StatusController.getWebsiteDetails(
      req.websiteInfo.name,
    );
    res.json({
      ...req.websiteInfo,
      ...details,
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch website details",
      message: error.message,
    });
  }
});

// GET /api/v1/websites/:website/performance
router.get("/:website/performance", validateWebsite, async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const performance = await StatusController.getWebsiteMetrics(
      req.websiteInfo.name,
      parseInt(days),
    );
    res.json(performance);
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch performance metrics",
      message: error.message,
    });
  }
});

// GET /api/v1/websites/:website/uptime
router.get("/:website/uptime", validateWebsite, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const uptime = await StatusController.calculateUptime(
      req.websiteInfo.name,
      parseInt(days),
    );
    res.json({
      website: req.websiteInfo.name,
      uptime: `${uptime.toFixed(2)}%`,
      period: `${days} days`,
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to calculate uptime",
      message: error.message,
    });
  }
});

module.exports = router;
