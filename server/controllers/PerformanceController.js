const PerformanceMetrics = require("../models/PerformanceMetrics");
const axios = require("axios");
const dns = require("dns").promises;

class PerformanceController {
  static async getCurrentMetrics(req, res) {
    try {
      const { website } = req.params;
      if (!website) {
        return res.status(400).json({
          error: "Website parameter is required",
        });
      }

      // Get current metrics
      const startTime = Date.now();
      let currentMetrics;

      try {
        const url = `https://www.${website.toLowerCase()}.com`;
        const dnsStart = Date.now();
        await dns.resolve4(new URL(url).hostname);
        const dnsTime = Date.now() - dnsStart;

        const response = await axios.get(url, {
          timeout: 10000,
          validateStatus: null,
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          },
        });

        const endTime = Date.now();
        const responseTime = endTime - startTime;

        currentMetrics = {
          responseTime,
          loadTime: response.headers["x-response-time"] || responseTime,
          dnsResolutionTime: dnsTime,
          statusCode: response.status,
          status:
            response.status >= 200 && response.status < 300 ? "Up" : "Down",
          availability:
            response.status >= 200 && response.status < 300 ? 100 : 0,
        };
      } catch (error) {
        currentMetrics = {
          responseTime: 0,
          loadTime: 0,
          dnsResolutionTime: 0,
          statusCode: error.response?.status || 500,
          status: "Down",
          availability: 0,
          error: error.message,
        };
      }

      // Save metrics to database
      await PerformanceMetrics.create({
        website,
        ...currentMetrics,
        timestamp: new Date(),
      });

      // Get historical metrics
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const historicalMetrics = await PerformanceMetrics.find({
        website,
        timestamp: { $gte: twentyFourHoursAgo },
      }).sort({ timestamp: -1 });

      // Calculate historical statistics
      const successfulChecks = historicalMetrics.filter(
        (m) => m.status === "Up",
      );
      const totalChecks = historicalMetrics.length;

      const historicalStats = {
        uptime_percentage: totalChecks
          ? ((successfulChecks.length / totalChecks) * 100).toFixed(2)
          : "100.00",
        average_response_time: successfulChecks.length
          ? (
              successfulChecks.reduce(
                (acc, curr) => acc + curr.responseTime,
                0,
              ) / successfulChecks.length
            ).toFixed(2)
          : "0.00",
        average_load_time: successfulChecks.length
          ? (
              successfulChecks.reduce((acc, curr) => acc + curr.loadTime, 0) /
              successfulChecks.length
            ).toFixed(2)
          : "0.00",
        total_checks: totalChecks,
        successful_checks: successfulChecks.length,
        failed_checks: totalChecks - successfulChecks.length,
      };

      res.json({
        website,
        current: currentMetrics,
        historical: historicalStats,
        last_checked: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error in getCurrentMetrics:", error);
      res.status(500).json({
        error: "Failed to fetch performance metrics",
        message: error.message,
      });
    }
  }

  static async getHistoricalMetrics(req, res) {
    try {
      const { website } = req.params;
      const { days = 7 } = req.query;

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(days));

      const metrics = await PerformanceMetrics.find({
        website,
        timestamp: { $gte: startDate },
      }).sort({ timestamp: 1 });

      const dailyStats = {};
      metrics.forEach((metric) => {
        const date = metric.timestamp.toISOString().split("T")[0];
        if (!dailyStats[date]) {
          dailyStats[date] = {
            total: 0,
            successful: 0,
            responseTime: 0,
            loadTime: 0,
          };
        }

        dailyStats[date].total++;
        if (metric.status === "Up") {
          dailyStats[date].successful++;
          dailyStats[date].responseTime += metric.responseTime;
          dailyStats[date].loadTime += metric.loadTime;
        }
      });

      // Calculate averages and uptimes
      Object.keys(dailyStats).forEach((date) => {
        const stats = dailyStats[date];
        stats.uptime = ((stats.successful / stats.total) * 100).toFixed(2);
        stats.avg_response_time = stats.successful
          ? (stats.responseTime / stats.successful).toFixed(2)
          : "0.00";
        stats.avg_load_time = stats.successful
          ? (stats.loadTime / stats.successful).toFixed(2)
          : "0.00";
      });

      res.json({
        website,
        period: `${days} days`,
        total_checks: metrics.length,
        daily_stats: dailyStats,
        raw_metrics: metrics,
      });
    } catch (error) {
      console.error("Error in getHistoricalMetrics:", error);
      res.status(500).json({
        error: "Failed to fetch historical metrics",
        message: error.message,
      });
    }
  }
}

module.exports = PerformanceController;
