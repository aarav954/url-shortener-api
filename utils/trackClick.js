const Click = require("../models/click.model");

const trackClick = (req, shortCode) => {
  Click.create({
    shortCode,
    ip: req.ip,
    userAgent: req.get("user-agent") || "",
    referrer: req.get("referer") || "direct",
  }).catch((err) => console.error("Click tracking failed:", err.message));
};

module.exports = trackClick;