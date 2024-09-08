// server/controllers/OutageController.js
const Outage = require("../models/Outage");

exports.getCurrentOutages = async (req, res) => {
  try {
    // Query for unresolved outages
    const outages = await Outage.find({ isResolved: false }).sort({
      startedAt: -1,
    });
    console.log(outages); // Log the result to check
    res.json(outages);
  } catch (error) {
    console.error(error); // Log the error to check
    res.status(500).json({ message: error.message });
  }
};

exports.getRecentOutages = async (req, res) => {
  try {
    const outages = await Outage.find().sort({ timestamp: -1 });
    res.json(outages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getOutageDetails = async (req, res) => {
  try {
    const { website } = req.params;
    const outages = await Outage.find({ website }).sort({ timestamp: -1 });
    res.json(outages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
