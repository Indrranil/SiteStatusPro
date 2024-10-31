const express = require("express");
const router = express.Router();
const {
  getDomainInfo,
  checkDomainNow,
  getExpiringDomains,
  updateDomainSettings,
} = require("../controllers/DomainController");
const { validateWebsiteParam } = require("../middleware/validation");
const { apiLimiter } = require("../middleware/rateLimiter");

// Apply rate limiting to all routes
router.use(apiLimiter);

// Validate website parameter for routes that need it
router.param("website", validateWebsiteParam);

// Routes
// Get list of domains nearing expiration (must be before /:website route)
router.get("/expiring", getExpiringDomains);

// Get domain information for a specific website
router.get("/:website", getDomainInfo);

// Manually trigger a domain check
router.post("/:website/check", checkDomainNow);

// Update domain settings
router.put("/:website/settings", updateDomainSettings);

module.exports = router;
