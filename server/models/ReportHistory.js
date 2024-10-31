const mongoose = require("mongoose");

const reportHistorySchema = new mongoose.Schema(
  {
    website: {
      type: String,
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    hourlyData: {
      type: Map,
      of: {
        total: Number,
        byType: {
          errorReceived: Number,
          inaccessible: Number,
          login: Number,
          slow: Number,
        },
      },
    },
    dailyTotal: {
      total: Number,
      byType: {
        errorReceived: Number,
        inaccessible: Number,
        login: Number,
        slow: Number,
      },
    },
    metadata: {
      averageResponseTime: Number,
      peakHour: String,
      outageDetected: Boolean,
    },
  },
  {
    timestamps: true,
  },
);

// Compound index for efficient querying
reportHistorySchema.index({ website: 1, date: -1 });

const ReportHistory = mongoose.model("ReportHistory", reportHistorySchema);

module.exports = ReportHistory;
