// services/reportAggregationService.js
const Report = require("../models/Report");
const ReportHistory = require("../models/ReportHistory");

const archiveReports = async () => {
  console.log("Starting report archiving process...");
  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);

  try {
    // Get reports older than 24 hours
    const reports = await Report.find({
      timestamp: { $lt: oneDayAgo },
    });

    // Group reports by website and problem type
    const groupedReports = reports.reduce((acc, report) => {
      const key = `${report.website}-${report.problemType}`;
      if (!acc[key]) {
        acc[key] = {
          website: report.website,
          problemType: report.problemType,
          count: 0,
          date: report.timestamp.toISOString().split("T")[0],
        };
      }
      acc[key].count++;
      return acc;
    }, {});

    // Create aggregated history records
    for (const key in groupedReports) {
      await ReportHistory.create(groupedReports[key]);
    }

    // Delete archived reports
    await Report.deleteMany({
      timestamp: { $lt: oneDayAgo },
    });

    console.log(`Archived ${reports.length} reports`);
  } catch (error) {
    console.error("Error archiving reports:", error);
    throw error;
  }
};

module.exports = { archiveReports };
