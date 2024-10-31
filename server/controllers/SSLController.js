const SSLCertificate = require("../models/SSLCertificate");
const SSLCertificateMonitor = require("../services/SSLCertificateMonitor");

const SSLController = {
  getSSLStatus: async function (req, res) {
    const { website } = req.params;

    try {
      // First check if we need to create initial SSL check
      let sslInfo = await SSLCertificate.findOne({ website }).sort({
        lastChecked: -1,
      });

      if (!sslInfo) {
        // Trigger initial SSL check
        const monitor = require("../services/SSLCertificateMonitor");
        try {
          const result = await monitor.monitorCertificate({
            name: website,
            url: `https://${website}`,
          });

          sslInfo = await SSLCertificate.findOne({ website }).sort({
            lastChecked: -1,
          });
        } catch (checkError) {
          console.error("Initial SSL check failed:", checkError);
        }
      }

      if (!sslInfo) {
        return res.status(404).json({
          error: "SSL certificate information not found",
          message:
            "Initial SSL check is pending. Please try again in a few moments.",
        });
      }

      res.json(sslInfo);
    } catch (error) {
      console.error("Error in getSSLStatus:", error);
      res.status(500).json({
        error: "Failed to fetch SSL certificate status",
        message: error.message,
      });
    }
  },

  getSSLHistory: function (req, res) {
    const { website } = req.params;
    const { days = 30 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    SSLCertificate.find({
      website,
      lastChecked: { $gte: startDate },
    })
      .sort({ lastChecked: -1 })
      .then((history) => {
        res.json({
          history,
          summary: {
            totalChecks: history.length,
            latestStatus: history[0]?.status,
            statusDistribution: history.reduce((acc, record) => {
              acc[record.status] = (acc[record.status] || 0) + 1;
              return acc;
            }, {}),
          },
        });
      })
      .catch((error) => {
        res.status(500).json({ error: error.message });
      });
  },

  triggerSSLCheck: function (req, res) {
    const { website } = req.params;
    SSLCertificateMonitor.monitorCertificate({
      name: website,
      url: `https://${website}`,
    })
      .then((result) => {
        res.json(result);
      })
      .catch((error) => {
        res.status(500).json({ error: error.message });
      });
  },
};

module.exports = SSLController;
