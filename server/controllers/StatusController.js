// fsd/server/controllers/StatusController.js

const axios = require("axios");
const Outage = require("../models/Outage");

const checkStatus = async (req, res) => {
  const { url } = req.body;
  console.log("Received URL:", url);
  try {
    const response = await axios.get(url);
    console.log("Response status:", response.status);
    if (response.status === 200) {
      return res.json({ message: "Website is up", status: response.status });
    } else {
      return res.json({
        message: "Website might be down",
        status: response.status,
      });
    }
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error checking status", error: error.message });
  }
};

module.exports = { checkStatus };
