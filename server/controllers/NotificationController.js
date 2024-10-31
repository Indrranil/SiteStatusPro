const NotificationSubscription = require("../models/NotificationSubscription");
const nodemailer = require("nodemailer");

// Configure email transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

exports.subscribe = async (req, res) => {
  try {
    const { email, website } = req.body;

    if (!email || !website) {
      return res
        .status(400)
        .json({ message: "Email and website are required" });
    }

    const existingSubscription = await NotificationSubscription.findOne({
      email,
      website,
      isActive: true,
    });

    if (existingSubscription) {
      return res.status(400).json({
        message: "You are already subscribed to notifications for this website",
      });
    }

    const subscription = new NotificationSubscription({
      email,
      website,
      isActive: true,
    });

    await subscription.save();
    res
      .status(201)
      .json({ message: "Successfully subscribed to notifications" });
  } catch (error) {
    console.error("Error in subscribe:", error);
    res.status(500).json({ message: "Failed to subscribe to notifications" });
  }
};

exports.sendNotifications = async (notification) => {
  try {
    // Extract website name from notification object
    const websiteName =
      typeof notification === "object" ? notification.website : notification;

    if (!websiteName) {
      throw new Error("Website name is required for notification");
    }

    // Find all active subscriptions for the website
    const subscriptions = await NotificationSubscription.find({
      website: websiteName,
      isActive: true,
      notifiedAt: null,
    });

    if (subscriptions.length === 0) return;

    // Prepare email content based on notification type
    let subject = "";
    let text = "";
    let html = "";

    if (typeof notification === "object") {
      if (notification.type === "performance_issue") {
        subject = `Performance Issue Detected - ${notification.website}`;
        text = `Performance issue detected for ${notification.website}
                Severity: ${notification.severity}
                TTFB: ${notification.details.ttfb}ms
                Load Time: ${notification.details.loadTime}ms
                DNS Time: ${notification.details.dnsTime}ms
                Timestamp: ${notification.details.timestamp}`;
        html = `
                    <h2>Performance Issue Detected</h2>
                    <p>Website: ${notification.website}</p>
                    <p>Severity: ${notification.severity}</p>
                    <p>Details:</p>
                    <ul>
                        <li>TTFB: ${notification.details.ttfb}ms</li>
                        <li>Load Time: ${notification.details.loadTime}ms</li>
                        <li>DNS Time: ${notification.details.dnsTime}ms</li>
                    </ul>
                    <p>Detected at: ${notification.details.timestamp}</p>
                `;
      } else {
        subject = `Status Update - ${notification.website}`;
        text = `Status update for ${notification.website}: ${notification.message}`;
        html = `<h2>Status Update</h2><p>${notification.message}</p>`;
      }
    } else {
      subject = `Status Update - ${websiteName}`;
      text = `Status update for ${websiteName}`;
      html = `<h2>Status Update for ${websiteName}</h2>`;
    }

    // Send emails to all subscribers
    for (const subscription of subscriptions) {
      try {
        await transporter.sendMail({
          from: process.env.SMTP_FROM,
          to: subscription.email,
          subject,
          text,
          html,
        });

        // Update subscription
        subscription.notifiedAt = new Date();
        subscription.isActive = false;
        await subscription.save();
      } catch (emailError) {
        console.error(
          `Failed to send email to ${subscription.email}:`,
          emailError,
        );
      }
    }
  } catch (error) {
    console.error("Error sending notifications:", error);
    throw error;
  }
};

exports.unsubscribe = async (req, res) => {
  try {
    const { email, website } = req.body;

    const subscription = await NotificationSubscription.findOne({
      email,
      website,
      isActive: true,
    });

    if (!subscription) {
      return res.status(404).json({
        message: "No active subscription found",
      });
    }

    subscription.isActive = false;
    await subscription.save();

    res.json({ message: "Successfully unsubscribed from notifications" });
  } catch (error) {
    console.error("Error in unsubscribe:", error);
    res
      .status(500)
      .json({ message: "Failed to unsubscribe from notifications" });
  }
};
