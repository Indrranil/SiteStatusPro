// server/controllers/OutageController.js
// server/controllers/OutageController.js

const Outage = require("../models/Outage");

exports.getCurrentOutages = async (req, res) => {
  try {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Query for unresolved outages within the last 24 hours
    const outages = await Outage.find({
      isResolved: false,
      startedAt: { $gte: twentyFourHoursAgo },
    }).sort({ startedAt: -1 });

    console.log(outages); // Log the result to check
    res.json(outages);
  } catch (error) {
    console.error(error); // Log the error to check
    res.status(500).json({ message: error.message });
  }
};

exports.getRecentOutages = async (req, res) => {
  try {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Query for all outages within the last 24 hours, sorted by the most recent
    const outages = await Outage.find({
      startedAt: { $gte: twentyFourHoursAgo },
    }).sort({ startedAt: -1 });

    res.json(outages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getOutageDetails = async (req, res) => {
  try {
    const { website } = req.params;
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Query for outages of a specific website within the last 24 hours
    const outages = await Outage.find({
      website,
      startedAt: { $gte: twentyFourHoursAgo },
    }).sort({ startedAt: -1 });

    res.json(outages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
