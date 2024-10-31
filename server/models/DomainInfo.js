const mongoose = require("mongoose");

const domainInfoSchema = new mongoose.Schema(
  {
    website: {
      type: String,
      required: true,
      index: true,
    },
    domain: {
      type: String,
      required: true,
    },
    registrar: {
      type: String,
      required: false,
    },
    createdDate: {
      type: Date,
      required: false,
    },
    expiryDate: {
      type: Date,
      required: true,
    },
    lastChecked: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["active", "expiring-soon", "expired", "error"],
      default: "active",
    },
    daysUntilExpiry: {
      type: Number,
      required: true,
    },
    autoRenew: {
      type: Boolean,
      default: false,
    },
    whoisData: {
      type: Object,
      required: false,
    },
  },
  {
    timestamps: true,
  },
);

// Index for efficient querying of expiring domains
domainInfoSchema.index({ status: 1, expiryDate: 1 });

const DomainInfo = mongoose.model("DomainInfo", domainInfoSchema);

module.exports = DomainInfo;
