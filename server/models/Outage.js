const mongoose = require("mongoose");

const outageSchema = mongoose.Schema(
  {
    website: {
      type: String,
      required: true,
      index: true,
    },
    startedAt: {
      type: Date,
      required: true,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    isResolved: {
      type: Boolean,
      default: false,
      index: true,
    },
    duration: {
      type: Number,
      default: 0,
    },
    statusCode: {
      type: Number,
      required: false,
    },
    error: {
      type: String,
      required: false,
    },
    errorType: {
      type: String,
      enum: ["timeout", "network", "other", null],
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// Add compound index for common queries
outageSchema.index({ website: 1, isResolved: 1 });

const Outage = mongoose.model("Outage", outageSchema);

module.exports = Outage;
