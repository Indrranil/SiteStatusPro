const mongoose = require("mongoose");

const notificationSubscriptionSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    website: {
      type: String,
      required: true,
      trim: true,
    },
    subscribedAt: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    notifiedAt: {
      type: Date,
      default: null,
    },
    notificationType: {
      type: String,
      enum: ["all", "outages", "performance"],
      default: "all",
    },
    lastNotified: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// Create a compound index to prevent duplicate active subscriptions
notificationSubscriptionSchema.index(
  { email: 1, website: 1, isActive: 1 },
  { unique: true, partialFilterExpression: { isActive: true } },
);

const NotificationSubscription = mongoose.model(
  "NotificationSubscription",
  notificationSubscriptionSchema,
);

module.exports = NotificationSubscription;
