// fsd/server/services/monitorWebsites.js
const axios = require("axios");
const Outage = require("../models/Outage");
const websitesToMonitor = require("../config/websitesToMonitor");

const checkWebsite = async (website) => {
  try {
    const response = await axios.get(website.url);
    return response.status === 200;
  } catch (error) {
    return false;
  }
};

const monitorWebsites = async () => {
  for (let website of websitesToMonitor) {
    const isUp = await checkWebsite(website);
    const existingOutage = await Outage.findOne({
      website: website.name,
      isResolved: false,
    });

    if (!isUp && !existingOutage) {
      // Website is down and no ongoing outage recorded, log new outage
      await Outage.create({
        website: website.name,
        startedAt: new Date(),
        isResolved: false,
      });
      console.log(`${website.name} is down. Outage logged.`);
    } else if (isUp && existingOutage) {
      // Website is up and there was an ongoing outage, mark it as resolved
      existingOutage.isResolved = true;
      existingOutage.resolvedAt = new Date();
      await existingOutage.save();
      console.log(`${website.name} is back up. Outage resolved.`);
    }
  }
};

module.exports = monitorWebsites;
