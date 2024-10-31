const asyncHandler = require("../middleware/asyncHandler");
const DomainInfo = require("../models/DomainInfo");
const whois = require("whois-json");
const WhoisService = require("../services/WhoisService");

exports.getDomainInfo = asyncHandler(async (req, res) => {
  const { website } = req.params;

  const domainInfo = await DomainInfo.findOne({ website })
    .sort({ lastChecked: -1 })
    .lean();

  if (!domainInfo) {
    return res.status(404).json({
      error: "Domain information not found",
      message: `No domain information available for ${website}`,
    });
  }

  res.json(domainInfo);
});

exports.checkDomainNow = asyncHandler(async (req, res) => {
  const { website } = req.params;
  const { domain } = req.body;

  try {
    const cleanDomain = domain
      .toLowerCase()
      .replace(/^https?:\/\//i, "")
      .replace(/^www\./i, "")
      .split("/")[0];

    console.log("Checking domain:", cleanDomain);

    const whoisData = await whois(cleanDomain, {
      follow: 2,
      timeout: 30000,
    });

    console.log("Raw WHOIS response:", whoisData);

    //const whoisInfo = await WhoisService.getWhoisInfo(cleanDomain);

    // Function to search for a value in nested objects
    const findInWhoisData = (keys, obj = whoisData) => {
      for (const key of keys) {
        if (obj && obj[key]) return obj[key];
      }
      // Search in data object if exists
      if (obj && obj.data) {
        for (const key of keys) {
          if (obj.data[key]) return obj.data[key];
        }
      }
      return null;
    };

    // Extract registrar - try multiple possible paths
    const registrar =
      findInWhoisData([
        "registrar",
        "Registrar",
        "registrarName",
        "registrarOrganization",
        "Registrar Name",
      ]) || "Unknown";

    // Extract creation date
    const creationDate = findInWhoisData([
      "creationDate",
      "Creation Date",
      "created",
      "domainRegistrationDate",
      "Domain Registration Date",
    ]);

    // Extract expiry date
    const expiryDate = findInWhoisData([
      "registrarRegistrationExpirationDate",
      "Registry Expiry Date",
      "expiryDate",
      "Expiry Date",
      "registryExpiryDate",
    ]);

    // Format the found dates
    const formatDate = (dateStr) => {
      if (!dateStr) return null;
      try {
        const date = new Date(dateStr);
        return date.toISOString().split("T")[0];
      } catch (e) {
        console.error("Date parsing error:", e);
        return null;
      }
    };

    // Calculate days until expiry
    const calculateDaysUntilExpiry = (expiryDateStr) => {
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
    };

    const domainInfo = {
      domain: cleanDomain,
      status: "Active",
      registrar: registrar.replace(/,.*$/, ""), // Clean up registrar name
      createdDate: formatDate(creationDate),
      expiryDate: formatDate(expiryDate),
      daysUntilExpiry: calculateDaysUntilExpiry(expiryDate),
      lastChecked: new Date().toISOString(),
      raw: whoisData,
    };

    console.log("Processed domain info:", domainInfo);

    // Save to database
    await DomainInfo.findOneAndUpdate({ website }, domainInfo, {
      upsert: true,
      new: true,
    });

    res.json({
      ...domainInfo,
      raw: undefined, // Don't send raw data in response
    });
  } catch (error) {
    console.error("Domain check error:", error);
    res.status(200).json({
      domain: cleanDomain,
      status: "error",
      error: error.message,
      lastChecked: new Date().toISOString(),
    });
  }
});
exports.getExpiringDomains = asyncHandler(async (req, res) => {
  const { days = 30 } = req.query;
  const date = new Date();
  date.setDate(date.getDate() + parseInt(days));

  const expiringDomains = await DomainInfo.find({
    expiryDate: { $lte: date },
    status: { $ne: "expired" },
  }).sort("expiryDate");

  res.json({
    count: expiringDomains.length,
    domains: expiringDomains,
  });
});

exports.updateDomainSettings = asyncHandler(async (req, res) => {
  const { website } = req.params;
  const { autoRenew } = req.body;

  const domainInfo = await DomainInfo.findOneAndUpdate(
    { website },
    { autoRenew },
    { new: true },
  );

  if (!domainInfo) {
    return res.status(404).json({
      error: "Domain not found",
      message: `No domain information found for ${website}`,
    });
  }

  res.json(domainInfo);
});
