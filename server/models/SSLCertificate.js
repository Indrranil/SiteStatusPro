const mongoose = require("mongoose");

const sslCertificateSchema = new mongoose.Schema(
  {
    website: {
      type: String,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["valid", "warning", "critical", "expired"],
      required: true,
    },
    issuer: {
      type: String,
      required: true,
    },
    validFrom: {
      type: Date,
      required: true,
    },
    validTo: {
      type: Date,
      required: true,
    },
    daysRemaining: {
      type: Number,
      required: true,
    },
    serialNumber: String,
    fingerprint: String,
    details: {
      version: Number,
      subjectAltName: String,
      infoAccess: mongoose.Schema.Types.Mixed,
    },
    lastChecked: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

// Index for efficient queries
sslCertificateSchema.index({ website: 1, lastChecked: -1 });

const SSLCertificate = mongoose.model("SSLCertificate", sslCertificateSchema);

module.exports = SSLCertificate;
