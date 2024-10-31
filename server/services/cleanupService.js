const Report = require("../models/Report");
const Outage = require("../models/Outage");
const Status = require("../models/Status");

/**
 * Cleans up old reports and resolved outages from the database
 * @param {Date} cutoffDate - Date before which records should be deleted
 * @returns {Promise<{deletedReports: number, deletedOutages: number, deletedStatuses: number}>}
 */
const cleanupOldReports = async (cutoffDate) => {
  try {
    const [reportResult, outageResult, statusResult] = await Promise.all([
      // Delete old reports
      Report.deleteMany({
        timestamp: { $lt: cutoffDate },
      }),

      // Delete old resolved outages
      Outage.deleteMany({
        resolvedAt: { $lt: cutoffDate },
        isResolved: true,
      }),

      // Delete old status records
      Status.deleteMany({
        timestamp: { $lt: cutoffDate },
      }),
    ]);

    const results = {
      deletedReports: reportResult.deletedCount,
      deletedOutages: outageResult.deletedCount,
      deletedStatuses: statusResult.deletedCount,
    };

    console.log("Cleanup completed:", results);

    return results;
  } catch (error) {
    console.error("Error during cleanup:", error);
    throw error;
  }
};

module.exports = {
  cleanupOldReports,
};
