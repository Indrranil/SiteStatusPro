const Status = require("../models/Status");
const Outage = require("../models/Outage");

class StatusController {
  static async getWebsiteDetails(website) {
    try {
      const status = await Status.findOne({ website }).sort({ timestamp: -1 });

      const currentOutage = await Outage.findOne({
        website,
        isResolved: false,
      });

      return {
        status: status?.status || "unknown",
        lastChecked: status?.timestamp || null,
        hasActiveOutage: !!currentOutage,
        lastOutageStart: currentOutage?.startedAt || null,
        responseTime: status?.responseTime || null,
      };
    } catch (error) {
      console.error(`Error getting website details for ${website}:`, error);
      throw error;
    }
  }

  static async getWebsiteMetrics(website, days = 7) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const metrics = await Status.find({
        website,
        timestamp: { $gte: startDate },
      }).sort({ timestamp: -1 });

      return {
        website,
        period: `${days} days`,
        total_checks: metrics.length,
        uptime_percentage: this.calculateUptimePercentage(metrics),
        average_response_time: this.calculateAverageResponseTime(metrics),
      };
    } catch (error) {
      console.error(`Error getting website metrics for ${website}:`, error);
      throw error;
    }
  }

  static async calculateUptime(website, days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const checks = await Status.find({
        website,
        timestamp: { $gte: startDate },
      });

      if (!checks.length) return 100;

      const upChecks = checks.filter((check) => check.status === "up").length;
      return (upChecks / checks.length) * 100;
    } catch (error) {
      console.error(`Error calculating uptime for ${website}:`, error);
      throw error;
    }
  }

  static calculateUptimePercentage(metrics) {
    if (!metrics.length) return 100;
    const upChecks = metrics.filter((m) => m.status === "up").length;
    return ((upChecks / metrics.length) * 100).toFixed(2);
  }

  static calculateAverageResponseTime(metrics) {
    if (!metrics.length) return 0;
    const total = metrics.reduce((sum, m) => sum + (m.responseTime || 0), 0);
    return (total / metrics.length).toFixed(2);
  }
}

module.exports = StatusController;
