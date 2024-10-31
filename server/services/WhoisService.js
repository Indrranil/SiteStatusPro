// File: services/WhoisService.js

const whois = require("whois-json");

class WhoisService {
  constructor() {
    this.WHOIS_TIMEOUT = process.env.WHOIS_TIMEOUT || 30000;
    this.WHOIS_FOLLOW_REDIRECTS = process.env.WHOIS_FOLLOW_REDIRECTS || 2;
    this.WHOIS_RETRY_ATTEMPTS = process.env.WHOIS_RETRY_ATTEMPTS || 3;
  }

  async parseWhoisResponse(domain) {
    try {
      const options = {
        follow: this.WHOIS_FOLLOW_REDIRECTS,
        timeout: this.WHOIS_TIMEOUT,
        verbose: true,
      };

      console.log(
        `Attempting WHOIS lookup for ${domain} with options:`,
        options,
      );

      const data = await whois(domain, options);

      if (!data) {
        throw new Error("No WHOIS data received");
      }

      // Log the entire response for debugging
      console.log("Full WHOIS response:", JSON.stringify(data, null, 2));

      return data;
    } catch (error) {
      console.error(`WHOIS lookup failed for ${domain}:`, error);
      throw new Error(`WHOIS lookup failed: ${error.message}`);
    }
  }

  findInWhoisData(keys, obj) {
    // Search directly in the object
    for (const key of keys) {
      if (obj && obj[key]) return obj[key];
    }

    // Search in data object if exists
    if (obj && obj.data) {
      for (const key of keys) {
        if (obj.data[key]) return obj.data[key];
      }
    }

    // Search in nested registrar data if exists
    if (obj && obj.registrarData) {
      for (const key of keys) {
        if (obj.registrarData[key]) return obj.registrarData[key];
      }
    }

    return null;
  }

  async getWhoisInfo(domain) {
    try {
      const whoisData = await this.parseWhoisResponse(domain);

      // Extract registrar
      const registrar =
        this.findInWhoisData(
          [
            "registrar",
            "Registrar",
            "registrarName",
            "registrarOrganization",
            "Registrar Name",
          ],
          whoisData,
        ) || "Unknown";

      // Extract creation date
      const creationDate = this.findInWhoisData(
        [
          "creationDate",
          "Creation Date",
          "created",
          "domainRegistrationDate",
          "Domain Registration Date",
        ],
        whoisData,
      );

      // Extract expiry date
      const expiryDate = this.findInWhoisData(
        [
          "registrarRegistrationExpirationDate",
          "Registry Expiry Date",
          "expiryDate",
          "Expiry Date",
          "registryExpiryDate",
        ],
        whoisData,
      );

      // Calculate days until expiry
      const daysUntilExpiry = this.calculateDaysUntilExpiry(expiryDate);

      return {
        domain,
        registrar: this.cleanRegistrarName(registrar),
        createdDate: this.formatDate(creationDate),
        expiryDate: this.formatDate(expiryDate),
        daysUntilExpiry,
        status: this.determineStatus(daysUntilExpiry),
        lastChecked: new Date().toISOString(),
        raw: whoisData,
      };
    } catch (error) {
      console.error(`Error getting WHOIS info for ${domain}:`, error);
      throw error;
    }
  }

  formatDate(dateStr) {
    if (!dateStr) return null;
    try {
      const date = new Date(dateStr);
      return date.toISOString().split("T")[0];
    } catch (e) {
      console.error("Date parsing error:", e);
      return null;
    }
  }

  calculateDaysUntilExpiry(expiryDateStr) {
    if (!expiryDateStr) return "N/A";
    try {
      const expiryDate = new Date(expiryDateStr);
      const now = new Date();
      const diffTime = expiryDate - now;
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } catch (e) {
      console.error("Error calculating days until expiry:", e);
      return "N/A";
    }
  }

  cleanRegistrarName(registrar) {
    return registrar
      .replace(/,.*$/, "") // Remove everything after comma
      .replace(/\s+LLC$/, " LLC") // Fix LLC spacing
      .trim();
  }

  determineStatus(daysUntilExpiry) {
    if (daysUntilExpiry === "N/A") return "Active";
    if (typeof daysUntilExpiry === "number") {
      if (daysUntilExpiry <= 0) return "Expired";
      if (daysUntilExpiry <= 30) return "Expiring Soon";
    }
    return "Active";
  }
}

module.exports = new WhoisService();
