// fsd/server/controllers/StatusController.js
const axios = require("axios");

const checkStatus = async (req, res) => {
  const { url } = req.body;
  try {
    const response = await axios.get(url);
    res.json({ message: `Website is up. Status code: ${response.status}` });
  } catch (error) {
    if (error.response) {
      res.json({
        message: `Website is down. Status code: ${error.response.status}`,
      });
    } else {
      res.json({ message: "Error checking status" });
    }
  }
};

module.exports = { checkStatus };
