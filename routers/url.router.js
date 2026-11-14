const express = require("express");
const { shorten, redirect, getStats, getAnalytics } = require("../controllers/url.controller");
const asyncHandler = require("../middlewares/asyncHandler");
const { createLimiter, generalLimiter } = require("../middlewares/rateLimiter");
const { validateShortenRequest } = require("../validators/url.validator");

const router = express.Router();

router.post("/shorten", createLimiter, validateShortenRequest, asyncHandler(shorten));
router.get("/stats/:code", generalLimiter, asyncHandler(getStats));
router.get("/analytics/:code", generalLimiter, asyncHandler(getAnalytics));
router.get("/:code", generalLimiter, asyncHandler(redirect));

module.exports = router;