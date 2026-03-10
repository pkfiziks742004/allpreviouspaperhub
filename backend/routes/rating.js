const express = require("express");
const router = express.Router();
const Rating = require("../models/rating");
const { verifyAdmin, verifyPermission } = require("../middleware/auth");

const RATING_CACHE_TTL_MS = Number(process.env.RATING_CACHE_TTL_MS || 30 * 1000);
let ratingStatsCache = null;

const formatRatingSummary = ({ sum, total }) => ({
  avg: total > 0 ? (sum / total).toFixed(1) : 0,
  total
});

const getCachedRatingSummary = async ({ force = false } = {}) => {
  const now = Date.now();
  if (!force && ratingStatsCache && now - ratingStatsCache.at < RATING_CACHE_TTL_MS) {
    return formatRatingSummary(ratingStatsCache);
  }

  const ratings = await Rating.find();
  const sum = ratings.reduce((acc, item) => acc + Number(item.rating || 0), 0);
  const total = ratings.length;
  ratingStatsCache = { sum, total, at: now };
  return formatRatingSummary(ratingStatsCache);
};

const invalidateRatingCache = () => {
  ratingStatsCache = null;
};

// Get average rating
router.get("/", async (req, res) => {
  try {
    const summary = await getCachedRatingSummary();
    res.json(summary);
  } catch (err) {
    res.status(500).json(err.message);
  }
});

// Add rating
router.post("/", async (req, res) => {
  try {
    const value = Number(req.body?.rating);
    if (!Number.isFinite(value)) return res.status(400).json("Rating is required");
    const ratingValue = Math.round(value);
    if (ratingValue < 1 || ratingValue > 5) {
      return res.status(400).json("Rating must be between 1 and 5");
    }

    const rating = new Rating({
      rating: ratingValue
    });

    await rating.save();
    if (ratingStatsCache) {
      ratingStatsCache = {
        sum: ratingStatsCache.sum + ratingValue,
        total: ratingStatsCache.total + 1,
        at: Date.now()
      };
    }

    res.json("Thanks for rating!");
  } catch (err) {
    res.status(500).json(err.message);
  }
});

// Admin: list all ratings (newest first)
router.get("/admin", verifyAdmin, verifyPermission("ratings"), async (req, res) => {
  try {
    const ratings = await Rating.find();
    ratings.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    res.json(ratings);
  } catch (err) {
    res.status(500).json(err.message);
  }
});

// Admin: delete rating by id
router.delete("/:id", verifyAdmin, verifyPermission("ratings"), async (req, res) => {
  try {
    await Rating.findByIdAndDelete(req.params.id);
    invalidateRatingCache();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json(err.message);
  }
});

module.exports = router;

