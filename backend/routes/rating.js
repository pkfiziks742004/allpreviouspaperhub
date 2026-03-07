const express = require("express");
const router = express.Router();
const Rating = require("../models/rating");
const { verifyAdmin, verifyPermission } = require("../middleware/auth");

// Get average rating
router.get("/", async (req, res) => {
  try {
    const ratings = await Rating.find();

    if (ratings.length === 0) {
      return res.json({
        avg: 0,
        total: 0
      });
    }

    let sum = 0;

    ratings.forEach(r => {
      sum += r.rating;
    });

    res.json({
      avg: (sum / ratings.length).toFixed(1),
      total: ratings.length
    });
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
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json(err.message);
  }
});

module.exports = router;

