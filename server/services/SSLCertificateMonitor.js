const https = require("https");
const tls = require("tls");
const { promisify } = require("util");
const SSLCertificate = require("../models/SSLCertificate");
const { sendNotifications } = require("../controllers/NotificationController");

// Constants for certificate monitoring
const CERTIFICATE_CHECK_INTERVAL = 24 * 60 * 60 * 1000; // Daily
const WARNING_THRESHOLD_DAYS = 30; // Warn when cert expires in 30 days
const CRITICAL_THRESHOLD_DAYS = 7; // Critical when cert expires in 7 days

class SSLCertificateMonitor {
  constructor() {
    this.metrics = new Map();
  }

  async getCertificateInfo(domain) {
    return new Promise((resolve, reject) => {
      const options = {
        host: domain,
        port: 443,
        method: "GET",
        rejectUnauthorized: false, // Allow self-signed certs for checking
        timeout: 10000, // 10 second timeout
      };

      const req = https.request(options, (res) => {
        try {
          const cert = res.connection.getPeerCertificate();

          // Check if certificate is empty
          if (!cert || Object.keys(cert).length === 0) {
            throw new Error("No SSL certificate found");
          }

          const validFrom = new Date(cert.valid_from);
          const validTo = new Date(cert.valid_to);
          const daysRemaining = Math.floor(
            (validTo - Date.now()) / (1000 * 60 * 60 * 24),
          );

          const certInfo = {
            subject: cert.subject,
            issuer: cert.issuer,
            validFrom,
            validTo,
            daysRemaining,
            serialNumber: cert.serialNumber,
            fingerprint: cert.fingerprint,
            status: this.getCertificateStatus(daysRemaining),
            details: {
              version: cert.version,
              subjectAltName: cert.subjectaltname,
              infoAccess: cert.infoAccess,
            },
          };

          resolve(certInfo);
        } catch (error) {
          reject(new Error(`Certificate parsing error: ${error.message}`));
        }
      });

      req.on("error", (error) => {
        reject(new Error(`Certificate request error: ${error.message}`));
      });

      // Handle timeout
      req.on("timeout", () => {
        req.destroy();
        reject(new Error("Certificate request timed out"));
      });

      req.end();
    });
  }

  getCertificateStatus(daysRemaining) {
    if (daysRemaining <= 0) return "expired";
    if (daysRemaining <= CRITICAL_THRESHOLD_DAYS) return "critical";
    if (daysRemaining <= WARNING_THRESHOLD_DAYS) return "warning";
    return "valid";
  }

  async monitorCertificate(website) {
    console.log(`Checking SSL certificate for ${website.name}...`);

    try {
      // Extract domain from URL
      const domain = this.extractDomain(website.url);
      const certInfo = await this.getCertificateInfo(domain);

      // Create new certificate record
      const sslCertificate = new SSLCertificate({
        website: website.name,
        status: certInfo.status,
        issuer: certInfo.issuer.CN || certInfo.issuer.O || "Unknown Issuer",
        validFrom: certInfo.validFrom,
        validTo: certInfo.validTo,
        daysRemaining: certInfo.daysRemaining,
        serialNumber: certInfo.serialNumber,
        fingerprint: certInfo.fingerprint,
        details: certInfo.details,
        lastChecked: new Date(),
      });

      await sslCertificate.save();

      // Handle alerts if needed
      if (["expired", "critical", "warning"].includes(certInfo.status)) {
        await this.handleCertificateAlert(website, certInfo);
      }

      // Log successful check
      console.log(`SSL certificate check completed for ${website.name}:`, {
        status: certInfo.status,
        daysRemaining: certInfo.daysRemaining,
        issuer: certInfo.issuer.CN || certInfo.issuer.O,
      });

      return {
        website: website.name,
        certInfo,
        success: true,
      };
    } catch (error) {
      console.error(`SSL certificate check failed for ${website.name}:`, error);

      // Save error state
      await SSLCertificate.create({
        website: website.name,
        status: "error",
        issuer: "Unknown",
        validFrom: new Date(),
        validTo: new Date(),
        daysRemaining: 0,
        details: {
          error: error.message,
        },
        lastChecked: new Date(),
      });

      return {
        website: website.name,
        error: error.message,
        success: false,
      };
    }
  }

  async handleCertificateAlert(website, certInfo) {
    const notification = {
      type: "ssl_certificate",
      website: website.name,
      severity: certInfo.status === "expired" ? "critical" : certInfo.status,
      details: {
        daysRemaining: certInfo.daysRemaining,
        expiryDate: certInfo.validTo,
        issuer: certInfo.issuer.CN || certInfo.issuer.O,
        message: this.getAlertMessage(certInfo),
        timestamp: new Date().toISOString(),
      },
    };

    try {
      await sendNotifications(notification);
      console.log(`Sent SSL certificate alert for ${website.name}`);
    } catch (error) {
      console.error(
        `Failed to send certificate notification for ${website.name}:`,
        error,
      );
    }
  }

  getAlertMessage(certInfo) {
    switch (certInfo.status) {
      case "expired":
        return "SSL certificate has expired! Immediate action required.";
      case "critical":
        return `SSL certificate will expire in ${certInfo.daysRemaining} days! Urgent renewal required.`;
      case "warning":
        return `SSL certificate will expire in ${certInfo.daysRemaining} days. Please plan for renewal.`;
      default:
        return "SSL certificate status check completed.";
    }
  }

  extractDomain(url) {
    try {
      // Remove protocol if present
      let domain = url.replace(/^https?:\/\//, "");
      // Remove path, query parameters, and fragments
      domain = domain.split("/")[0];
      // Remove port if present
      domain = domain.split(":")[0];
      // Remove www. if present
      domain = domain.replace(/^www\./, "");
      return domain;
    } catch (error) {
      throw new Error(`Invalid URL format: ${url}`);
    }
  }

  async getHistoricalMetrics(website, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    try {
      const certificates = await SSLCertificate.find({
        website,
        lastChecked: { $gte: startDate },
      })
        .sort({ lastChecked: -1 })
        .lean();

      return {
        certificates,
        summary: this.calculateMetricsSummary(certificates),
      };
    } catch (error) {
      console.error(
        `Error fetching historical SSL metrics for ${website}:`,
        error,
      );
      throw error;
    }
  }

  calculateMetricsSummary(certificates) {
    if (!certificates.length) return null;

    const statusCounts = certificates.reduce((acc, cert) => {
      acc[cert.status] = (acc[cert.status] || 0) + 1;
      return acc;
    }, {});

    const latestCertificate = certificates[0];
    const oldestCertificate = certificates[certificates.length - 1];

    return {
      totalChecks: certificates.length,
      statusDistribution: statusCounts,
      latestStatus: {
        status: latestCertificate.status,
        daysRemaining: latestCertificate.daysRemaining,
        checkedAt: latestCertificate.lastChecked,
      },
      timeSpan: {
        from: oldestCertificate.lastChecked,
        to: latestCertificate.lastChecked,
      },
      averageDaysRemaining: Math.round(
        certificates.reduce((sum, cert) => sum + cert.daysRemaining, 0) /
          certificates.length,
      ),
    };
  }

  // Utility method to validate certificates in bulk
  async bulkCheckCertificates(websites) {
    const results = [];

    for (const website of websites) {
      try {
        const result = await this.monitorCertificate(website);
        results.push(result);
        // Add delay between checks to prevent rate limiting
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        results.push({
          website: website.name,
          error: error.message,
          success: false,
        });
      }
    }

    return results;
  }

  // Method to check if a specific certificate needs attention
  needsAttention(certInfo) {
    return certInfo.status !== "valid";
  }
}

// Export a singleton instance
module.exports = new SSLCertificateMonitor();
