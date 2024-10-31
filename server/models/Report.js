const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema({
  website: {
    type: String,
    required: true,
  },
  problemType: {
    type: String,
    enum: ["Error received", "Inaccessible", "Login", "Slow"],
    required: true,
  },
  user: {
    type: String,
    required: false, // Now optional since we have isAnonymous
  },
  country: {
    type: String,
    required: false, // Also optional
  },
  isAnonymous: {
    type: Boolean,
    default: false, // Default is false, so reports are considered non-anonymous by default
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const Report = mongoose.model("Report", reportSchema);

module.exports = Report;
