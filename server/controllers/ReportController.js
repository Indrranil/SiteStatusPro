// server/controllers/ReportController.js
const Outage = require("../models/Outage");
const Report = require("../models/Report");

exports.reportIssue = async (req, res) => {
  try {
    const { website, problemType } = req.body;
    const outage = new Outage({
      website,
      startedAt: new Date(),
      problemType,
      isResolved: false,
    });
    await outage.save();
    res.status(201).json(outage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getWebsiteDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const outages = await Outage.find({ website: id }).sort({ startedAt: -1 });
    res.json({
      status: outages.length > 0 ? "Down" : "Up",
      outages,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getReportsForWebsite = async (req, res) => {
  try {
    const { website } = req.params;
    const reports = await Report.find({
      website,
      timestamp: { $gte: new Date(Date.now() - 30 * 60 * 1000) },
    }).sort({ timestamp: -1 });
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
