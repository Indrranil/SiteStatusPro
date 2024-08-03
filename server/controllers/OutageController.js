// server/controllers/OutageController.js
const Outage = require("../models/Outage");

exports.getCurrentOutages = async (req, res) => {
  try {
    const outages = await Outage.find({ status: "down" }).sort({
      timestamp: -1,
    });
    res.json(outages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getRecentOutages = async (req, res) => {
  try {
    const outages = await Outage.find().sort({ timestamp: -1 }).limit(10);
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
