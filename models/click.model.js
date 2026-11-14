const mongoose = require("mongoose");

const clickSchema = new mongoose.Schema({
  shortCode: { type: String, required: true, index: true },
  clickedAt: { type: Date, default: Date.now, index: true },
  ip: { type: String, default: "" },
  userAgent: { type: String, default: "" },
  referrer: { type: String, default: "direct" },
});

module.exports = mongoose.model("Click", clickSchema);