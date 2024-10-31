const Outage = require("../models/Outage");
const Report = require("../models/Report");

const OutageController = {
  getCurrentOutages: async () => {
    const outages = await Outage.find({ isResolved: false }).sort({
      startedAt: -1,
    });

    return outages.map((outage) => ({
      id: outage._id,
      website: outage.website,
      startedAt: outage.startedAt,
      duration: Date.now() - new Date(outage.startedAt),
      reportCount: outage.reportCount || 0,
    }));
  },

  getRecentOutages: async (page = 1, limit = 10) => {
    const skip = (page - 1) * limit;

    const [outages, total] = await Promise.all([
      Outage.find().sort({ startedAt: -1 }).skip(skip).limit(limit),
      Outage.countDocuments(),
    ]);

    return {
      outages: outages.map((outage) => ({
        id: outage._id,
        website: outage.website,
        startedAt: outage.startedAt,
        resolvedAt: outage.resolvedAt,
        duration: outage.resolvedAt
          ? new Date(outage.resolvedAt) - new Date(outage.startedAt)
          : Date.now() - new Date(outage.startedAt),
        isResolved: outage.isResolved,
        reportCount: outage.reportCount || 0,
      })),
      pagination: {
        current: page,
        total: Math.ceil(total / limit),
        hasMore: skip + outages.length < total,
      },
    };
  },

  getOutageStats: async (website, period = "day") => {
    const periods = {
      day: 24 * 60 * 60 * 1000,
      week: 7 * 24 * 60 * 60 * 1000,
      month: 30 * 24 * 60 * 60 * 1000,
    };

    const startDate = new Date(Date.now() - periods[period]);

    const [outages, reports] = await Promise.all([
      Outage.find({
        website,
        startedAt: { $gte: startDate },
      }).sort({ startedAt: 1 }),
      Report.find({
        website,
        timestamp: { $gte: startDate },
      }).sort({ timestamp: 1 }),
    ]);

    // Prepare timeline data
    const timeline = reports.reduce((acc, report) => {
      const hour = new Date(report.timestamp).toLocaleTimeString();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {});

    // Prepare distribution data
    const distribution = reports.reduce((acc, report) => {
      acc[report.problemType] = (acc[report.problemType] || 0) + 1;
      return acc;
    }, {});

    return {
      timeline: {
        labels: Object.keys(timeline),
        data: Object.values(timeline),
      },
      distribution: {
        labels: Object.keys(distribution),
        data: Object.values(distribution),
      },
      summary: {
        total_outages: outages.length,
        total_reports: reports.length,
        active_outages: outages.filter((o) => !o.isResolved).length,
        resolved_outages: outages.filter((o) => o.isResolved).length,
      },
    };
  },

  getWebsiteOutages: async (website) => {
    const outages = await Outage.find({ website }).sort({ startedAt: -1 });

    return outages.map((outage) => ({
      id: outage._id,
      startedAt: outage.startedAt,
      resolvedAt: outage.resolvedAt,
      duration: outage.resolvedAt
        ? new Date(outage.resolvedAt) - new Date(outage.startedAt)
        : Date.now() - new Date(outage.startedAt),
      isResolved: outage.isResolved,
      reportCount: outage.reportCount || 0,
    }));
  },
};

module.exports = OutageController;
