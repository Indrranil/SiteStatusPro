const Outage = require("../models/Outage");
const Report = require("../models/Report");
const ReportHistory = require("../models/ReportHistory");

// Function to handle user reporting an issue
exports.reportIssue = async (req, res) => {
  try {
    const { website, problemType, user, country } = req.body;

    // Create a new report
    const report = new Report({
      website,
      problemType,
      user,
      country,
      timestamp: new Date(),
    });
    await report.save();

    // Check for potential outage by counting recent reports
    const recentReportsCount = await Report.countDocuments({
      website,
      timestamp: { $gte: new Date(Date.now() - 5 * 60000) }, // Last 5 minutes
    });

    // If there are more than 10 reports in 5 minutes, create an outage
    if (recentReportsCount > 10) {
      const existingOutage = await Outage.findOne({
        website,
        isResolved: false,
      });

      if (!existingOutage) {
        await Outage.create({
          website,
          startedAt: new Date(),
          isResolved: false,
        });
      }
    }

    res.status(201).json(report);
  } catch (error) {
    console.error("Error in reportIssue:", error);
    res.status(500).json({ message: error.message });
  }
};

// Function to get website details including outages
exports.getWebsiteDetails = async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch all outages for this website, sorted by latest outage first
    const outages = await Outage.find({ website: id })
      .sort({ startedAt: -1 })
      .limit(10); // Limit to last 10 outages for performance

    // Determine current status
    const hasUnresolvedOutage = outages.some((outage) => !outage.isResolved);
    const status = hasUnresolvedOutage ? "Down" : "Up";

    // Get last resolved outage info
    let lastOutage = null;
    const lastResolvedOutage = outages.find((outage) => outage.isResolved);

    if (lastResolvedOutage) {
      const duration =
        new Date(lastResolvedOutage.resolvedAt) -
        new Date(lastResolvedOutage.startedAt);
      lastOutage = {
        startedAt: lastResolvedOutage.startedAt,
        resolvedAt: lastResolvedOutage.resolvedAt,
        duration: `${Math.floor(duration / 60000)} minutes`,
      };
    }

    res.json({
      status,
      lastOutage,
      outages: outages.map((outage) => ({
        startedAt: outage.startedAt,
        resolvedAt: outage.resolvedAt,
        duration: outage.resolvedAt
          ? `${Math.floor((new Date(outage.resolvedAt) - new Date(outage.startedAt)) / 60000)} minutes`
          : "Ongoing",
      })),
    });
  } catch (error) {
    console.error("Error in getWebsiteDetails:", error);
    res.status(500).json({ message: error.message });
  }
};

// Function to get recent and historical reports for a website
exports.getReportsForWebsite = async (req, res) => {
  try {
    const { website } = req.params;
    const now = new Date();
    const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);

    // Get recent reports
    const recentReports = await Report.find({
      website,
      timestamp: { $gte: thirtyMinutesAgo },
    }).sort({ timestamp: -1 });

    // Get historical data for the past 24 hours
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const historicalReports = await Report.find({
      website,
      timestamp: {
        $gte: twentyFourHoursAgo,
        $lt: thirtyMinutesAgo,
      },
    });

    // Prepare time-series data
    const reportCountsOverTime = {};
    const allReports = [...recentReports, ...historicalReports];

    allReports.forEach((report) => {
      const timeSlot = new Date(report.timestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
      reportCountsOverTime[timeSlot] =
        (reportCountsOverTime[timeSlot] || 0) + 1;
    });

    // Calculate problem type distribution
    const pieData = {
      errorReceived: allReports.filter(
        (r) => r.problemType === "Error received",
      ).length,
      inaccessible: allReports.filter((r) => r.problemType === "Inaccessible")
        .length,
      login: allReports.filter((r) => r.problemType === "Login").length,
      slow: allReports.filter((r) => r.problemType === "Slow").length,
    };

    // Get historical aggregates
    const historicalData = await ReportHistory.findOne({
      website,
      date: {
        $gte: new Date(now.setHours(0, 0, 0, 0)),
      },
    });

    res.json({
      reports: recentReports,
      reportCountsOverTime,
      pieData,
      historical: {
        todayTotal: allReports.length,
        previousDayData: historicalData?.dailyTotal || null,
        hourlyAverages: historicalData?.hourlyData || null,
        metadata: historicalData?.metadata || null,
      },
    });
  } catch (error) {
    console.error("Error in getReportsForWebsite:", error);
    res.status(500).json({ message: error.message });
  }
};

// Function to get historical report data
exports.getHistoricalReports = async (req, res) => {
  try {
    const { website } = req.params;
    const { days = 30 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const historicalData = await ReportHistory.find({
      website,
      date: { $gte: startDate },
    }).sort({ date: -1 });

    const aggregatedData = {
      dailyTotals: historicalData.map((day) => ({
        date: day.date,
        total: day.dailyTotal.total,
        byType: day.dailyTotal.byType,
      })),
      problemTrends: calculateProblemTrends(historicalData),
      peakHours: calculatePeakHours(historicalData),
      totalReports: historicalData.reduce(
        (sum, day) => sum + day.dailyTotal.total,
        0,
      ),
    };

    res.json(aggregatedData);
  } catch (error) {
    console.error("Error in getHistoricalReports:", error);
    res.status(500).json({ message: error.message });
  }
};

// Helper function to calculate problem trends
const calculateProblemTrends = (historicalData) => {
  return historicalData.reduce((trends, day) => {
    Object.entries(day.dailyTotal.byType).forEach(([type, count]) => {
      if (!trends[type]) trends[type] = [];
      trends[type].push({ date: day.date, count });
    });
    return trends;
  }, {});
};

// Helper function to calculate peak hours
const calculatePeakHours = (historicalData) => {
  const hourlyTotals = new Array(24).fill(0);
  let totalDays = 0;

  historicalData.forEach((day) => {
    totalDays++;
    Object.entries(day.hourlyData).forEach(([hour, data]) => {
      hourlyTotals[parseInt(hour)] += data.total;
    });
  });

  return hourlyTotals.map((total) => total / totalDays);
};

module.exports = exports;
