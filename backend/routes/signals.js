const express = require("express");
const sanitizeHtml = require("sanitize-html");
const { randomUUID } = require("crypto");
const Setting = require("../models/Setting");

const router = express.Router();

const ensureSettings = async () => {
  let settings = await Setting.findOne();
  if (!settings) {
    settings = await Setting.create({
      noticeUpdates: [],
      searchKeywords: [],
      feedbackRequests: []
    });
  }
  return settings;
};

const safeText = value =>
  sanitizeHtml(String(value || "").trim(), {
    allowedTags: [],
    allowedAttributes: {}
  });

const safeSource = value => safeText(value).toLowerCase().slice(0, 40);

router.get("/notices", async (req, res) => {
  try {
    const settings = await ensureSettings();
    const now = new Date();
    const notices = Array.isArray(settings.noticeUpdates) ? settings.noticeUpdates : [];
    const active = notices
      .filter(item => !item?.expiresAt || new Date(item.expiresAt) >= now)
      .sort((a, b) => {
        if (!!a?.pinTop !== !!b?.pinTop) return a?.pinTop ? -1 : 1;
        return new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0);
      });

    res.json(active);
  } catch (err) {
    res.status(500).json(err.message);
  }
});

router.post("/search", async (req, res) => {
  try {
    const term = safeText(req.body?.term).slice(0, 120);
    const source = safeSource(req.body?.source) || "unknown";
    if (!term || term.length < 2) {
      return res.status(400).json("Search term is required");
    }

    const settings = await ensureSettings();
    const keywords = Array.isArray(settings.searchKeywords) ? settings.searchKeywords : [];
    const idx = keywords.findIndex(item => String(item.term || "").toLowerCase() === term.toLowerCase());

    if (idx >= 0) {
      const sources = {
        ...(keywords[idx].sources || {}),
        [source]: Number((keywords[idx].sources || {})[source] || 0) + 1
      };
      keywords[idx] = {
        ...keywords[idx],
        count: Number(keywords[idx].count || 0) + 1,
        sources,
        lastSource: source,
        updatedAt: new Date().toISOString()
      };
    } else {
      keywords.unshift({
        term,
        count: 1,
        sources: { [source]: 1 },
        lastSource: source,
        updatedAt: new Date().toISOString()
      });
    }

    settings.searchKeywords = keywords.slice(0, 500);
    await settings.save();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json(err.message);
  }
});

router.post("/feedback", async (req, res) => {
  try {
    const text = safeText(req.body?.text).slice(0, 600);
    const source = safeSource(req.body?.source) || "unknown";
    if (!text || text.length < 5) {
      return res.status(400).json("Feedback text is too short");
    }

    const settings = await ensureSettings();
    const requests = Array.isArray(settings.feedbackRequests) ? settings.feedbackRequests : [];
    requests.unshift({
      id: randomUUID(),
      text,
      status: "pending",
      highlight: false,
      createdAt: new Date().toISOString(),
      source
    });

    settings.feedbackRequests = requests.slice(0, 1000);
    await settings.save();
    res.json({ ok: true, message: "Request submitted" });
  } catch (err) {
    res.status(500).json(err.message);
  }
});

module.exports = router;
