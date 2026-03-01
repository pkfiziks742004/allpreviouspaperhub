const express = require("express");
const router = express.Router();
const AdsSetting = require("../models/AdsSetting");
const { verifyAdmin, verifyPermission } = require("../middleware/auth");

const defaults = {
  enabled: false,
  headScript: "",
  bodyScript: "",
  adsTxt: ""
};

router.get("/", async (req, res) => {
  try {
    let settings = await AdsSetting.findOne();
    if (!settings) settings = await AdsSetting.create(defaults);
    res.json(settings);
  } catch (err) {
    res.status(500).json(err.message);
  }
});

router.put("/", verifyAdmin, verifyPermission("adsSettings"), async (req, res) => {
  try {
    const payload = {
      enabled: req.body.enabled,
      headScript: req.body.headScript,
      bodyScript: req.body.bodyScript,
      adsTxt: req.body.adsTxt
    };

    let settings = await AdsSetting.findOne();
    if (!settings) {
      settings = await AdsSetting.create({ ...defaults, ...payload });
    } else {
      if (payload.enabled !== undefined) settings.enabled = payload.enabled;
      if (payload.headScript !== undefined) settings.headScript = payload.headScript;
      if (payload.bodyScript !== undefined) settings.bodyScript = payload.bodyScript;
      if (payload.adsTxt !== undefined) settings.adsTxt = payload.adsTxt;
      await settings.save();
    }

    res.json(settings);
  } catch (err) {
    res.status(500).json(err.message);
  }
});

module.exports = router;
