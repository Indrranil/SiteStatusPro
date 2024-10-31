const axios = require("axios");
const Outage = require("../models/Outage");
const Report = require("../models/Report");
const Status = require("../models/Status");
const websitesToMonitor = require("../config/websitesToMonitor");
const { sendNotifications } = require("../controllers/NotificationController");

// Custom headers to mimic a real browser
const browserHeaders = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.5",
  Connection: "keep-alive",
};

// Status codes that indicate a website is functioning
const acceptableStatusCodes = [
  200, 201, 202, 203, 204, 206, 301, 302, 307, 308,
];

// Check for high report volume
const hasHighReportVolume = async (website) => {
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
  const recentReports = await Report.countDocuments({
    website,
    timestamp: { $gte: thirtyMinutesAgo },
  });
  return recentReports >= 10; // High volume threshold
};

// Function to check individual website status
const checkWebsite = async (website) => {
  const startTime = Date.now();
  try {
    const response = await axios.get(website.url, {
      timeout: 15000,
      maxRedirects: 5,
      validateStatus: null,
      headers: browserHeaders,
    });

    const responseTime = Date.now() - startTime;
    const hasHighVolume = await hasHighReportVolume(website.name);
    const isUp =
      acceptableStatusCodes.includes(response.status) && !hasHighVolume;

    // Log status check details
    console.log(`Status Check - ${website.name}:`, {
      url: website.url,
      statusCode: response.status,
      responseTime: `${responseTime}ms`,
      isUp,
      reportVolume: hasHighVolume ? "High" : "Normal",
      timestamp: new Date().toISOString(),
    });

    // Save status check result
    await Status.create({
      website: website.name,
      status: isUp ? "Up" : "Down",
      statusCode: response.status,
      responseTime,
      details: {
        hasHighReportVolume: hasHighVolume,
        timestamp: new Date(),
      },
    });

    return {
      isUp,
      statusCode: response.status,
      responseTime,
      highReportVolume: hasHighVolume,
    };
  } catch (error) {
    // Classify error types
    const errorType =
      error.code === "ECONNABORTED"
        ? "timeout"
        : error.code === "ECONNREFUSED"
          ? "connection_refused"
          : error.code === "ENOTFOUND"
            ? "dns_not_found"
            : "unknown";

    console.error(`Error checking ${website.name}:`, {
      url: website.url,
      errorType,
      message: error.message,
      code: error.code,
      timestamp: new Date().toISOString(),
    });

    // Save error status
    await Status.create({
      website: website.name,
      status: "Down",
      statusCode: error.response?.status || 0,
      responseTime: Date.now() - startTime,
      details: {
        error: error.message,
        errorType,
        timestamp: new Date(),
      },
    });

    return {
      isUp: false,
      statusCode: error.response?.status || 0,
      error: error.message,
      errorType,
    };
  }
};

// Main monitoring function
const monitorWebsites = async () => {
  console.log("\nStarting website monitoring cycle...");
  const startTime = Date.now();

  try {
    // Get current outages
    const existingOutages = await Outage.find({ isResolved: false });
    const ongoingOutages = new Map(
      existingOutages.map((outage) => [outage.website, outage]),
    );

    // Monitor each website with rate limiting
    for (const website of websitesToMonitor) {
      try {
        console.log(`\nChecking ${website.name}...`);
        const status = await checkWebsite(website);
        const outageExists = ongoingOutages.has(website.name);

        if (!status.isUp && !outageExists) {
          // New outage detected
          const newOutage = await Outage.create({
            website: website.name,
            startedAt: new Date(),
            isResolved: false,
            statusCode: status.statusCode,
            error: status.error,
            errorType: status.errorType,
            highReportVolume: status.highReportVolume,
          });

          console.log(`New outage detected for ${website.name}:`, {
            outageId: newOutage._id,
            statusCode: status.statusCode,
            error: status.error,
            timestamp: new Date().toISOString(),
          });

          // Send outage notifications
          try {
            await sendNotifications({
              website: website.name,
              status: "down",
              details: {
                statusCode: status.statusCode,
                error: status.error,
                time: new Date().toISOString(),
              },
            });
          } catch (notifyError) {
            console.error(
              `Failed to send outage notifications for ${website.name}:`,
              notifyError,
            );
          }
        } else if (status.isUp && outageExists) {
          // Resolve existing outage
          const outage = ongoingOutages.get(website.name);
          const duration = new Date() - new Date(outage.startedAt);

          await Outage.findByIdAndUpdate(outage._id, {
            isResolved: true,
            resolvedAt: new Date(),
            duration: duration,
          });

          console.log(`Outage resolved for ${website.name}:`, {
            outageId: outage._id,
            duration: `${Math.round(duration / 60000)} minutes`,
            timestamp: new Date().toISOString(),
          });

          // Send recovery notifications
          try {
            await sendNotifications({
              website: website.name,
              status: "up",
              details: {
                duration: `${Math.round(duration / 60000)} minutes`,
                time: new Date().toISOString(),
              },
            });
          } catch (notifyError) {
            console.error(
              `Failed to send recovery notifications for ${website.name}:`,
              notifyError,
            );
          }
        }

        // Rate limiting delay
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Error processing ${website.name}:`, error);
      }
    }

    const duration = Date.now() - startTime;
    console.log(`\nMonitoring cycle completed in ${duration}ms`);
  } catch (error) {
    console.error("Critical error in monitoring process:", error);
    throw error;
  }
};

// Export functions for testing and reuse
module.exports = {
  monitorWebsites,
  checkWebsite,
  hasHighReportVolume,
};
