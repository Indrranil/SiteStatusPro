const axios = require("axios");
const dns = require("dns");
const { promisify } = require("util");
const websitesToMonitor = require("../config/websitesToMonitor");
const PerformanceMetrics = require("../models/PerformanceMetrics");
const { sendNotifications } = require("../controllers/NotificationController");

const dnsResolve = promisify(dns.resolve);

// Performance thresholds
const THRESHOLDS = {
  ttfb: {
    warning: 1000, // 1 second
    critical: 2000, // 2 seconds
  },
  loadTime: {
    warning: 3000, // 3 seconds
    critical: 5000, // 5 seconds
  },
  dnsTime: {
    warning: 500, // 500ms
    critical: 1000, // 1 second
  },
};

class PerformanceMonitor {
  constructor() {
    this.metrics = {};
    this.retryAttempts = 2;
    this.retryDelay = 1000; // 1 second
  }

  async retry(fn, attempts = this.retryAttempts) {
    for (let i = 0; i < attempts; i++) {
      try {
        return await fn();
      } catch (error) {
        if (i === attempts - 1) throw error;
        await new Promise((resolve) => setTimeout(resolve, this.retryDelay));
      }
    }
  }

  async measureTTFB(url) {
    return this.retry(async () => {
      const startTime = process.hrtime();
      try {
        const response = await axios.get(url, {
          timeout: 10000,
          validateStatus: false,
          onDownloadProgress: (progressEvent) => {
            if (progressEvent.loaded === 1) {
              const [seconds, nanoseconds] = process.hrtime(startTime);
              return seconds * 1000 + nanoseconds / 1000000;
            }
          },
        });

        const [seconds, nanoseconds] = process.hrtime(startTime);
        const ttfb = seconds * 1000 + nanoseconds / 1000000;

        return {
          value: ttfb,
          status: response.status,
          success: true,
          severity:
            ttfb > THRESHOLDS.ttfb.critical
              ? "critical"
              : ttfb > THRESHOLDS.ttfb.warning
                ? "warning"
                : "normal",
        };
      } catch (error) {
        console.error(`TTFB measurement failed for ${url}:`, error.message);
        return {
          value: null,
          status: error.response?.status || 0,
          success: false,
          error: error.message,
          severity: "critical",
        };
      }
    });
  }

  async measureLoadTime(url) {
    return this.retry(async () => {
      const startTime = process.hrtime();
      try {
        const response = await axios.get(url, {
          timeout: 30000,
          validateStatus: false,
        });

        const [seconds, nanoseconds] = process.hrtime(startTime);
        const loadTime = seconds * 1000 + nanoseconds / 1000000;

        return {
          value: loadTime,
          contentLength: parseInt(response.headers["content-length"]) || null,
          status: response.status,
          success: true,
          severity:
            loadTime > THRESHOLDS.loadTime.critical
              ? "critical"
              : loadTime > THRESHOLDS.loadTime.warning
                ? "warning"
                : "normal",
        };
      } catch (error) {
        console.error(
          `Load time measurement failed for ${url}:`,
          error.message,
        );
        return {
          value: null,
          status: error.response?.status || 0,
          success: false,
          error: error.message,
          severity: "critical",
        };
      }
    });
  }

  async getDNSResolutionTime(domain) {
    return this.retry(async () => {
      const startTime = process.hrtime();
      try {
        const [addresses] = await Promise.all([
          dnsResolve(domain),
          new Promise((resolve) => setTimeout(resolve, 5000)), // 5s timeout
        ]);

        const [seconds, nanoseconds] = process.hrtime(startTime);
        const dnsTime = seconds * 1000 + nanoseconds / 1000000;

        return {
          value: dnsTime,
          addresses,
          success: true,
          severity:
            dnsTime > THRESHOLDS.dnsTime.critical
              ? "critical"
              : dnsTime > THRESHOLDS.dnsTime.warning
                ? "warning"
                : "normal",
        };
      } catch (error) {
        console.error(`DNS resolution failed for ${domain}:`, error.message);
        return {
          value: null,
          success: false,
          error: error.message,
          severity: "critical",
        };
      }
    });
  }

  async getFullMetrics(website) {
    console.log(`Collecting metrics for ${website.name}...`);
    try {
      const domain = new URL(website.url).hostname;
      const [ttfbResult, loadTimeResult, dnsResult] = await Promise.all([
        this.measureTTFB(website.url),
        this.measureLoadTime(website.url),
        this.getDNSResolutionTime(domain),
      ]);

      const metrics = {
        website: website.name,
        url: website.url,
        timestamp: new Date(),
        ttfb: ttfbResult,
        loadTime: loadTimeResult,
        dns: dnsResult,
        overall: {
          success:
            ttfbResult.success && loadTimeResult.success && dnsResult.success,
          severity: this.calculateOverallSeverity(
            ttfbResult,
            loadTimeResult,
            dnsResult,
          ),
        },
      };

      await this.handlePerformanceIssues(metrics);
      return metrics;
    } catch (error) {
      console.error(`Failed to collect metrics for ${website.name}:`, error);
      return {
        website: website.name,
        url: website.url,
        timestamp: new Date(),
        error: error.message,
        success: false,
      };
    }
  }

  calculateOverallSeverity(ttfb, loadTime, dns) {
    const severities = [ttfb.severity, loadTime.severity, dns.severity];
    if (severities.includes("critical")) return "critical";
    if (severities.includes("warning")) return "warning";
    return "normal";
  }

  async handlePerformanceIssues(metrics) {
    if (metrics.overall.severity !== "normal") {
      const notification = {
        type: "performance_issue",
        website: metrics.website,
        severity: metrics.overall.severity,
        details: {
          ttfb: metrics.ttfb.value,
          loadTime: metrics.loadTime.value,
          dnsTime: metrics.dns.value,
          timestamp: metrics.timestamp,
        },
      };

      try {
        await sendNotifications(notification);
      } catch (error) {
        console.error("Failed to send performance notification:", error);
      }
    }
  }

  async monitorPerformance() {
    console.log("\nStarting performance monitoring cycle...");
    const startTime = Date.now();
    const results = [];

    try {
      for (const website of websitesToMonitor) {
        try {
          const metrics = await this.getFullMetrics(website);

          // Save to database
          const performanceMetric = await PerformanceMetrics.create({
            ...metrics,
            timestamp: new Date(),
          });

          results.push({
            website: website.name,
            metrics: performanceMetric,
            success: true,
          });

          // Rate limiting
          await new Promise((resolve) => setTimeout(resolve, 1000));
        } catch (error) {
          console.error(`Error monitoring ${website.name}:`, error);
          results.push({
            website: website.name,
            error: error.message,
            success: false,
          });
        }
      }

      const duration = Date.now() - startTime;
      console.log(`Performance monitoring cycle completed in ${duration}ms`);

      return results;
    } catch (error) {
      console.error("Critical error during performance monitoring:", error);
      throw error;
    }
  }

  async getHistoricalMetrics(website, days = 7) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const metrics = await PerformanceMetrics.find({
        website,
        timestamp: { $gte: startDate },
      })
        .sort({ timestamp: -1 })
        .limit(100);

      return {
        metrics,
        summary: this.calculateMetricsSummary(metrics),
      };
    } catch (error) {
      console.error(`Error fetching historical metrics for ${website}:`, error);
      throw error;
    }
  }

  calculateMetricsSummary(metrics) {
    const validMetrics = metrics.filter((m) => m.overall.success);
    if (!validMetrics.length) return null;

    const average = (arr) => arr.reduce((a, b) => a + b) / arr.length;

    return {
      ttfb: {
        avg: average(validMetrics.map((m) => m.ttfb.value)),
        max: Math.max(...validMetrics.map((m) => m.ttfb.value)),
        min: Math.min(...validMetrics.map((m) => m.ttfb.value)),
      },
      loadTime: {
        avg: average(validMetrics.map((m) => m.loadTime.value)),
        max: Math.max(...validMetrics.map((m) => m.loadTime.value)),
        min: Math.min(...validMetrics.map((m) => m.loadTime.value)),
      },
      dns: {
        avg: average(validMetrics.map((m) => m.dns.value)),
        max: Math.max(...validMetrics.map((m) => m.dns.value)),
        min: Math.min(...validMetrics.map((m) => m.dns.value)),
      },
      successRate: (validMetrics.length / metrics.length) * 100,
    };
  }
}

const performanceMonitor = new PerformanceMonitor();

module.exports = {
  performanceMonitor,
  monitorPerformance: () => performanceMonitor.monitorPerformance(),
  THRESHOLDS,
};
