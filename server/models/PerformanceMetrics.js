const mongoose = require("mongoose");

const performanceMetricsSchema = new mongoose.Schema(
  {
    website: {
      type: String,
      required: true,
      index: true,
    },
    // Basic Performance Metrics
    responseTime: {
      type: Number,
      required: true,
      default: 0,
    },
    loadTime: {
      type: Number,
      required: true,
      default: 0,
    },
    dnsResolutionTime: {
      type: Number,
      required: true,
      default: 0,
    },
    // Status Information
    statusCode: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["Up", "Down"],
      required: true,
    },
    availability: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    // SSL Certificate Metrics
    ssl: {
      status: {
        type: String,
        enum: ["valid", "warning", "critical", "expired", "error"],
        required: false,
      },
      issuer: {
        type: String,
        required: false,
      },
      validFrom: {
        type: Date,
        required: false,
      },
      validTo: {
        type: Date,
        required: false,
      },
      daysRemaining: {
        type: Number,
        required: false,
      },
      lastChecked: {
        type: Date,
        required: false,
      },
      fingerprint: {
        type: String,
        required: false,
      },
      details: {
        version: Number,
        serialNumber: String,
        subjectAltName: String,
        errorMessage: String,
      },
    },
    // Error Tracking
    error: {
      type: String,
      required: false,
    },
    // Timestamp
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

// Add compound indices for efficient queries
performanceMetricsSchema.index({ website: 1, timestamp: -1 });
performanceMetricsSchema.index({ "ssl.status": 1, timestamp: -1 });
performanceMetricsSchema.index({ website: 1, "ssl.status": 1 });

// Method to get average performance metrics
performanceMetricsSchema.statics.getAverageMetrics = async function (
  website,
  startDate,
  endDate,
) {
  return this.aggregate([
    {
      $match: {
        website,
        timestamp: { $gte: startDate, $lte: endDate },
        status: "Up",
      },
    },
    {
      $group: {
        _id: null,
        avgResponseTime: { $avg: "$responseTime" },
        avgLoadTime: { $avg: "$loadTime" },
        avgDnsTime: { $avg: "$dnsResolutionTime" },
        totalChecks: { $sum: 1 },
        successfulChecks: {
          $sum: { $cond: [{ $eq: ["$status", "Up"] }, 1, 0] },
        },
      },
    },
  ]);
};

// Method to get SSL certificate metrics
performanceMetricsSchema.statics.getSSLMetrics = async function (
  website,
  startDate,
  endDate,
) {
  return this.aggregate([
    {
      $match: {
        website,
        timestamp: { $gte: startDate, $lte: endDate },
        "ssl.status": { $exists: true },
      },
    },
    {
      $group: {
        _id: null,
        // Latest SSL status
        latestStatus: { $last: "$ssl.status" },
        latestCheck: { $last: "$ssl.lastChecked" },
        // Days remaining stats
        avgDaysRemaining: { $avg: "$ssl.daysRemaining" },
        minDaysRemaining: { $min: "$ssl.daysRemaining" },
        // Status distribution
        totalChecks: { $sum: 1 },
        validCount: {
          $sum: { $cond: [{ $eq: ["$ssl.status", "valid"] }, 1, 0] },
        },
        warningCount: {
          $sum: { $cond: [{ $eq: ["$ssl.status", "warning"] }, 1, 0] },
        },
        criticalCount: {
          $sum: { $cond: [{ $eq: ["$ssl.status", "critical"] }, 1, 0] },
        },
        expiredCount: {
          $sum: { $cond: [{ $eq: ["$ssl.status", "expired"] }, 1, 0] },
        },
        errorCount: {
          $sum: { $cond: [{ $eq: ["$ssl.status", "error"] }, 1, 0] },
        },
      },
    },
    {
      $project: {
        _id: 0,
        latestStatus: 1,
        latestCheck: 1,
        avgDaysRemaining: { $round: ["$avgDaysRemaining", 1] },
        minDaysRemaining: 1,
        totalChecks: 1,
        statusDistribution: {
          valid: "$validCount",
          warning: "$warningCount",
          critical: "$criticalCount",
          expired: "$expiredCount",
          error: "$errorCount",
        },
        healthScore: {
          $multiply: [
            {
              $divide: ["$validCount", { $max: ["$totalChecks", 1] }],
            },
            100,
          ],
        },
      },
    },
  ]);
};

// Method to get combined metrics (performance + SSL)
performanceMetricsSchema.statics.getCombinedMetrics = async function (
  website,
  startDate,
  endDate,
) {
  const [performanceMetrics, sslMetrics] = await Promise.all([
    this.getAverageMetrics(website, startDate, endDate),
    this.getSSLMetrics(website, startDate, endDate),
  ]);

  return {
    performance: performanceMetrics[0] || null,
    ssl: sslMetrics[0] || null,
    timestamp: new Date(),
    period: {
      start: startDate,
      end: endDate,
    },
  };
};

// Method to get latest metrics
performanceMetricsSchema.statics.getLatestMetrics = async function (website) {
  return this.findOne({ website })
    .sort({ timestamp: -1 })
    .select("-__v")
    .lean();
};

const PerformanceMetrics = mongoose.model(
  "PerformanceMetrics",
  performanceMetricsSchema,
);

module.exports = PerformanceMetrics;
