const whois = require("whois-json");
const DomainInfo = require("../models/DomainInfo");
const { sendNotifications } = require("../controllers/NotificationController");

class DomainMonitorService {
  constructor() {
    this.WARNING_THRESHOLD = 30; // Days before expiry to start warning
    this.CRITICAL_THRESHOLD = 7; // Days before expiry for critical warning
  }

  async checkDomain(domain) {
    try {
      console.log(`Checking domain: ${domain}`);
      const whoisData = await whois(domain, { follow: 3, timeout: 30000 });

      if (!whoisData) {
        throw new Error("No WHOIS data received");
      }

      console.log("WHOIS raw data:", whoisData);

      // Try different possible field names for expiry date
      const expiryDate =
        whoisData.registryExpiryDate ||
        whoisData["Registry Expiry Date"] ||
        whoisData.expirationDate ||
        whoisData["Expiration Date"] ||
        whoisData.expires ||
        null;

      // Try different possible field names for creation date
      const createdDate =
        whoisData.creationDate ||
        whoisData["Creation Date"] ||
        whoisData.created ||
        whoisData["Registration Date"] ||
        null;

      // Try different possible field names for registrar
      const registrar =
        whoisData.registrar ||
        whoisData["Registrar"] ||
        whoisData.registrarName ||
        "Unknown Registrar";

      if (!expiryDate) {
        throw new Error("Could not determine expiry date");
      }

      const expiry = new Date(expiryDate);
      const now = new Date();
      const daysUntilExpiry = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));

      let status = "active";
      if (daysUntilExpiry <= 0) {
        status = "expired";
      } else if (daysUntilExpiry <= this.CRITICAL_THRESHOLD) {
        status = "expiring-soon";
      }

      return {
        expiryDate: expiry,
        createdDate: createdDate ? new Date(createdDate) : null,
        daysUntilExpiry,
        status,
        registrar,
        lastChecked: new Date(),
        whoisData: whoisData,
      };
    } catch (error) {
      console.error(`Error in checkDomain for ${domain}:`, error);
      return {
        status: "error",
        error: error.message,
        lastChecked: new Date(),
        domain,
      };
    }
  }

  async monitorDomain(website, domain) {
    try {
      console.log(`Monitoring domain for ${website}: ${domain}`);
      if (!domain) {
        throw new Error("Domain is required");
      }

      // Clean the domain string
      const cleanDomain = domain
        .toLowerCase()
        .replace(/^https?:\/\//i, "")
        .replace(/^www\./i, "")
        .split("/")[0];

      const domainInfo = await this.checkDomain(cleanDomain);

      // Save to database even if there's an error, to track check attempts
      const updated = await DomainInfo.findOneAndUpdate(
        { website },
        {
          domain: cleanDomain,
          ...domainInfo,
          lastChecked: new Date(),
        },
        { upsert: true, new: true },
      );

      // Send notifications if domain is expiring soon or has errors
      if (
        domainInfo.status === "expiring-soon" ||
        domainInfo.status === "expired"
      ) {
        await this.sendExpiryNotification(website, updated);
      }

      return updated;
    } catch (error) {
      console.error(`Error monitoring domain for ${website}:`, error);

      // Save error state to database
      await DomainInfo.findOneAndUpdate(
        { website },
        {
          domain,
          status: "error",
          error: error.message,
          lastChecked: new Date(),
        },
        { upsert: true },
      );

      throw error;
    }
  }

  async sendExpiryNotification(website, domainInfo) {
    const notificationData = {
      type: "domain_expiry",
      website,
      severity: domainInfo.status === "expired" ? "critical" : "warning",
      details: {
        domain: domainInfo.domain,
        expiryDate: domainInfo.expiryDate,
        daysUntilExpiry: domainInfo.daysUntilExpiry,
        registrar: domainInfo.registrar,
      },
    };

    try {
      await sendNotifications(notificationData);
    } catch (error) {
      console.error("Error sending domain expiry notification:", error);
    }
  }
}

module.exports = new DomainMonitorService();
