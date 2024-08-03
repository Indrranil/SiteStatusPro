// server/models/Status.js
const mongoose = require("mongoose");

const statusSchema = new mongoose.Schema({
  website: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const Status = mongoose.model("Status", statusSchema);

module.exports = Status;
