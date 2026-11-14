const { nanoid } = require('nanoid');
const Url = require('../models/url.model');
const trackClick = require("../utils/trackClick");
const Click = require("../models/click.model");

const shorten = async (req, res) => {
  const { originalUrl, customAlias, expiresInMinutes } = req.body;

  let expiresAt = null;
  if (expiresInMinutes !== undefined) {
    const mins = Number(expiresInMinutes);
    if (!Number.isInteger(mins) || mins < 1 || mins > 525600) {
      return res.status(400).json({
        error: "expiresInMinutes must be a whole number from 1 to 525600",
      });
    }
    expiresAt = new Date(Date.now() + mins * 60 * 1000);
  }

  if (customAlias) {
    if (!/^[a-zA-Z0-9_-]{3,20}$/.test(customAlias)) {
      return res.status(400).json({
        error: "Alias must be 3-20 characters: letters, numbers, - or _",
      });
    }
    const reserved = ["shorten", "health", "stats","analytics"];
    if (reserved.includes(customAlias.toLowerCase())) {
      return res.status(400).json({ error: "This alias is reserved" });
    }
    const taken = await Url.findOne({ shortCode: customAlias });
    if (taken) {
      return res.status(409).json({ error: "Alias already in use" });
    }
    await Url.create({
      originalUrl,
      shortCode: customAlias,
      isCustom: true,
      expiresAt,
    });
    return res.status(201).json({
      shortUrl: `${process.env.BASE_URL}/${customAlias}`,
      expiresAt,
    });
  }

  if (!expiresAt) {
    const existing = await Url.findOne({
      originalUrl,
      isCustom: false,
      expiresAt: null,
    });
    if (existing) {
      return res.status(200).json({
        shortUrl: `${process.env.BASE_URL}/${existing.shortCode}`,
        expiresAt: null,
      });
    }
  }

  const shortCode = nanoid(7);
  await Url.create({ originalUrl, shortCode, expiresAt });
  res.status(201).json({
    shortUrl: `${process.env.BASE_URL}/${shortCode}`,
    expiresAt,
  });
};

const redirect = async (req, res) => {
  const doc = await Url.findOne({ shortCode: req.params.code });
  if (!doc) return res.status(404).json({ error: "Not found" });

  if (doc.expiresAt && doc.expiresAt < new Date()) {
    return res.status(410).json({ error: "This link has expired" });
  }

  doc.clicks += 1;
  await doc.save();
    trackClick(req, doc.shortCode);
  res.redirect(doc.originalUrl);
};

const getStats = async (req, res) => {
  const doc = await Url.findOne({ shortCode: req.params.code });
  if (!doc) return res.status(404).json({ error: "Not found" });

  const expired = doc.expiresAt ? doc.expiresAt < new Date() : false;

  res.json({
    shortCode: doc.shortCode,
    shortUrl: `${process.env.BASE_URL}/${doc.shortCode}`,
    originalUrl: doc.originalUrl,
    clicks: doc.clicks,
    isCustom: doc.isCustom,
    createdAt: doc.createdAt,
    expiresAt: doc.expiresAt,
    expired,
  });
};
const getAnalytics = async (req, res) => {
  const doc = await Url.findOne({ shortCode: req.params.code });
  if (!doc) return res.status(404).json({ error: "Not found" });

  const [result] = await Click.aggregate([
    { $match: { shortCode: doc.shortCode } },
    {
      $facet: {
        total: [{ $count: "count" }],
        perDay: [
          {
            $group: {
              _id: { $dateToString: { format: "%Y-%m-%d", date: "$clickedAt" } },
              clicks: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
          { $project: { _id: 0, date: "$_id", clicks: 1 } },
        ],
        referrers: [
          { $group: { _id: "$referrer", clicks: { $sum: 1 } } },
          { $sort: { clicks: -1 } },
          { $limit: 5 },
          { $project: { _id: 0, referrer: "$_id", clicks: 1 } },
        ],
        browsers: [
          {
            $addFields: {
              browser: {
                $switch: {
                  branches: [
                    { case: { $regexMatch: { input: "$userAgent", regex: "Edg/" } }, then: "Edge" },
                    { case: { $regexMatch: { input: "$userAgent", regex: "OPR/|Opera" } }, then: "Opera" },
                    { case: { $regexMatch: { input: "$userAgent", regex: "Chrome/" } }, then: "Chrome" },
                    { case: { $regexMatch: { input: "$userAgent", regex: "Firefox/" } }, then: "Firefox" },
                    { case: { $regexMatch: { input: "$userAgent", regex: "Safari/" } }, then: "Safari" },
                  ],
                  default: "Other",
                },
              },
            },
          },
          { $group: { _id: "$browser", clicks: { $sum: 1 } } },
          { $sort: { clicks: -1 } },
          { $project: { _id: 0, browser: "$_id", clicks: 1 } },
        ],
        devices: [
          {
            $addFields: {
              device: {
                $cond: [
                  { $regexMatch: { input: "$userAgent", regex: "Mobile|Android|iPhone" } },
                  "Mobile",
                  "Desktop",
                ],
              },
            },
          },
          { $group: { _id: "$device", clicks: { $sum: 1 } } },
          { $sort: { clicks: -1 } },
          { $project: { _id: 0, device: "$_id", clicks: 1 } },
        ],
      },
    },
  ]);

  res.json({
    shortCode: doc.shortCode,
    originalUrl: doc.originalUrl,
    totalClicks: result.total[0] ? result.total[0].count : 0,
    clicksPerDay: result.perDay,
    topReferrers: result.referrers,
    browsers: result.browsers,
    devices: result.devices,
  });
};

module.exports = { shorten, redirect, getStats, getAnalytics };