// server/utils/CheckWebsite.js
const axios = require("axios");

const checkWebsite = async (url) => {
  try {
    const response = await axios.get(url);
    return response.status === 200 ? "up" : "down";
  } catch (error) {
    return "down";
  }
};

module.exports = checkWebsite;
