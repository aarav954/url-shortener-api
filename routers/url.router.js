const express = require("express");
const { shorten, redirect, getStats } = require("../controllers/url.controller");
const asyncHandler = require("../middlewares/asyncHandler");
const { createLimiter, generalLimiter } = require("../middlewares/rateLimiter");

const router = express.Router();

router.post("/shorten", createLimiter, asyncHandler(shorten));
router.get("/stats/:code", generalLimiter, asyncHandler(getStats));
router.get("/:code", generalLimiter, asyncHandler(redirect));

module.exports = router;