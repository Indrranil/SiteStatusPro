// server/routes/AnalyticsRoutes.js
const express = require("express");
const router = express.Router();
const Report = require("../models/Report");
const Outage = require("../models/Outage");

// Get overall system analytics
router.get("/system", async (req, res) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [totalReports, totalOutages, activeOutages, recentReports] =
      await Promise.all([
        Report.countDocuments(),
        Outage.countDocuments(),
        Outage.countDocuments({ isResolved: false }),
        Report.countDocuments({ timestamp: { $gte: thirtyDaysAgo } }),
      ]);

    res.json({
      totalReports,
      totalOutages,
      activeOutages,
      recentReports,
      periodStart: thirtyDaysAgo,
      lastUpdated: new Date(),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get analytics for a specific website
router.get("/website/:website", async (req, res) => {
  try {
    const { website } = req.params;
    const { period = "30" } = req.query; // Default to 30 days
    const startDate = new Date(
      Date.now() - parseInt(period) * 24 * 60 * 60 * 1000,
    );

    const [reports, outages] = await Promise.all([
      Report.find({
        website,
        timestamp: { $gte: startDate },
      }).sort({ timestamp: -1 }),
      Outage.find({
        website,
        startedAt: { $gte: startDate },
      }).sort({ startedAt: -1 }),
    ]);

    // Calculate problem type distribution
    const problemTypes = reports.reduce((acc, report) => {
      acc[report.problemType] = (acc[report.problemType] || 0) + 1;
      return acc;
    }, {});

    // Calculate average outage duration
    const avgOutageDuration =
      outages.reduce((acc, outage) => {
        const duration = (outage.resolvedAt || new Date()) - outage.startedAt;
        return acc + duration;
      }, 0) / (outages.length || 1);

    // Group reports by day
    const dailyReports = reports.reduce((acc, report) => {
      const date = report.timestamp.toISOString().split("T")[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    res.json({
      summary: {
        totalReports: reports.length,
        totalOutages: outages.length,
        activeOutages: outages.filter((o) => !o.isResolved).length,
        averageOutageDuration: Math.round(avgOutageDuration / (1000 * 60)), // in minutes
      },
      problemDistribution: problemTypes,
      dailyReports,
      period: {
        start: startDate,
        days: parseInt(period),
      },
      outages: outages.map((o) => ({
        startedAt: o.startedAt,
        resolvedAt: o.resolvedAt,
        duration: Math.round(
          ((o.resolvedAt || new Date()) - o.startedAt) / (1000 * 60),
        ), // in minutes
      })),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get trending issues across all websites
router.get("/trends", async (req, res) => {
  try {
    const { hours = "24" } = req.query;
    const startTime = new Date(Date.now() - parseInt(hours) * 60 * 60 * 1000);

    const reports = await Report.find({
      timestamp: { $gte: startTime },
    }).sort({ timestamp: -1 });

    // Group by website and problem type
    const trends = reports.reduce((acc, report) => {
      if (!acc[report.website]) {
        acc[report.website] = {};
      }
      acc[report.website][report.problemType] =
        (acc[report.website][report.problemType] || 0) + 1;
      return acc;
    }, {});

    // Calculate trending score for each website
    const trendingWebsites = Object.entries(trends)
      .map(([website, problems]) => ({
        website,
        totalReports: Object.values(problems).reduce((a, b) => a + b, 0),
        problems,
        trendingScore:
          Object.values(problems).reduce((a, b) => a + b, 0) / parseInt(hours),
      }))
      .sort((a, b) => b.trendingScore - a.trendingScore);

    res.json({
      trends: trendingWebsites,
      period: {
        hours: parseInt(hours),
        start: startTime,
      },
      totalReports: reports.length,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get performance metrics
router.get("/performance", async (req, res) => {
  try {
    const { days = "7" } = req.query;
    const startDate = new Date(
      Date.now() - parseInt(days) * 24 * 60 * 60 * 1000,
    );

    const [outages, reports] = await Promise.all([
      Outage.find({ startedAt: { $gte: startDate } }),
      Report.find({ timestamp: { $gte: startDate } }),
    ]);

    // Calculate response times
    const avgResolutionTime =
      outages.reduce((acc, outage) => {
        if (outage.resolvedAt) {
          return acc + (outage.resolvedAt - outage.startedAt);
        }
        return acc;
      }, 0) / (outages.filter((o) => o.resolvedAt).length || 1);

    res.json({
      metrics: {
        avgResolutionTime: Math.round(avgResolutionTime / (1000 * 60)), // in minutes
        totalOutages: outages.length,
        totalReports: reports.length,
        unresolvedOutages: outages.filter((o) => !o.resolvedAt).length,
      },
      period: {
        days: parseInt(days),
        start: startDate,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
