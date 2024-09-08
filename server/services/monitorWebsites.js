const axios = require("axios");
const Outage = require("../models/Outage");
const websitesToMonitor = require("../config/websitesToMonitor");

// Function to check the status of a website
const checkWebsite = async (website) => {
  try {
    const response = await axios.get(website.url);
    return response.status === 200;
  } catch (error) {
    return false;
  }
};

// Function to monitor websites and log outages
const monitorWebsites = async () => {
  // Retrieve all existing outages from the database
  const existingOutages = await Outage.find({ isResolved: false });

  // Create a set of ongoing outages to check for duplicates
  const ongoingOutages = new Set(
    existingOutages.map((outage) => outage.website),
  );

  for (let website of websitesToMonitor) {
    const isUp = await checkWebsite(website);
    const outageExists = ongoingOutages.has(website.name);

    if (!isUp && !outageExists) {
      // Website is down and no ongoing outage recorded, log new outage
      await Outage.create({
        website: website.name,
        startedAt: new Date(),
        isResolved: false,
      });
      console.log(`${website.name} is down. Outage logged.`);
    } else if (isUp && outageExists) {
      // Website is up and there was an ongoing outage, mark it as resolved
      await Outage.updateOne(
        { website: website.name, isResolved: false },
        { $set: { isResolved: true, resolvedAt: new Date() } },
      );
      console.log(`${website.name} is back up. Outage resolved.`);
    }
  }
};

module.exports = monitorWebsites;
