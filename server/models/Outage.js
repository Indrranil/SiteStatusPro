// server/models/OutageModel.js
const mongoose = require("mongoose");

const outageSchema = mongoose.Schema(
  {
    website: {
      type: String,
      required: true,
    },
    startedAt: {
      type: Date,
      required: true,
    },
    resolvedAt: {
      type: Date,
      required: false,
    },
    isResolved: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // Automatically manage createdAt and updatedAt fields
  },
);

const Outage = mongoose.model("Outage", outageSchema);

module.exports = Outage;
