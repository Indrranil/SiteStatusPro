// fsd/server/controllers/ReportController.js
const Report = require("../models/Report");

exports.reportIssue = async (req, res) => {
  try {
    const { website, issueType, user, country } = req.body;
    const newReport = new Report({ website, issueType, user, country });
    await newReport.save();
    res.status(201).json(newReport);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getReports = async (req, res) => {
  try {
    const reports = await Report.find({});
    res.status(200).json(reports);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
