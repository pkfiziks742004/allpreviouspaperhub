const router = require("express").Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { verifyAdmin, verifySuperAdmin, verifyPermission } = require("../middleware/auth");
const { buildPermissions, ADMIN_PERMISSIONS } = require("../constants/adminPermissions");
const normalizeEmail = value => String(value || "").trim().toLowerCase();
const normalizeName = value => String(value || "").trim().replace(/\s+/g, " ");
const isValidEmail = email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
const isStrongPassword = password => {
  const text = String(password || "");
  return (
    text.length >= 8 &&
    /[A-Z]/.test(text) &&
    /[a-z]/.test(text) &&
    /[0-9]/.test(text) &&
    /[^A-Za-z0-9]/.test(text)
  );
};
const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const sanitizeSubAdminPermissions = source => {
  const safePermissions = buildPermissions(false);
  ADMIN_PERMISSIONS.forEach(key => {
    safePermissions[key] = !!(source && source[key]);
  });
  // Never allow account settings access for sub admins.
  safePermissions.accountSettings = false;
  return safePermissions;
};

// ADMIN REGISTER (Only once)
router.post("/register", async (req, res) => {
  try {

    const { name, email, password } = req.body;
    const normalizedName = normalizeName(name);
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedName || normalizedName.length < 2) {
      return res.status(400).json("Name must be at least 2 characters");
    }
    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json("Enter a valid email");
    }
    if (!isStrongPassword(password)) {
      return res.status(400).json("Password must be 8+ chars with upper, lower, number and special character");
    }

    const totalUsers = await User.countDocuments();
    if (totalUsers > 0) {
      return res.status(403).json("Registration disabled");
    }

    const exist = await User.findOne({ email: normalizedEmail });
    if (exist) return res.status(400).json("Admin already exists");

    const hash = await bcrypt.hash(password, 10);

    const user = new User({
      name: normalizedName,
      email: normalizedEmail,
      password: hash,
      role: "super_admin",
      permissions: buildPermissions(true),
      isActive: true
    });

    await user.save();

    res.json("Admin Registered Successfully");

  } catch (err) {
    res.status(500).json(err.message);
  }
});


// LOGIN
router.post("/login", async (req, res) => {
  try {

    const { email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) return res.status(404).json("User not found");
    if (!user.isActive) return res.status(403).json("Account disabled");

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json("Wrong password");

    const role = user.role === "admin" ? "super_admin" : user.role;
    let sid = "";
    if (role === "sub_admin") {
      const now = new Date();
      const activeExpiry = user.currentSessionExpiresAt ? new Date(user.currentSessionExpiresAt) : null;
      if (
        user.currentSessionId &&
        activeExpiry &&
        activeExpiry > now
      ) {
        return res.status(403).json("Sub admin already logged in. Logout first.");
      }

      sid = crypto.randomBytes(24).toString("hex");
      user.currentSessionId = sid;
      user.currentSessionExpiresAt = new Date(Date.now() + SESSION_MAX_AGE_MS);
      await user.save();
    }

    const token = jwt.sign(
      { id: user._id, role, sid },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    const permissions =
      role === "super_admin" ? buildPermissions(true) : sanitizeSubAdminPermissions(user.permissions || {});

    res.json({
      token,
      role,
      name: user.name,
      permissions
    });

  } catch (err) {
    res.status(500).json(err.message);
  }
});

router.post("/logout", verifyAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json("User not found");
    const role = user.role === "admin" ? "super_admin" : user.role;
    if (role === "sub_admin") {
      user.currentSessionId = "";
      user.currentSessionExpiresAt = null;
      await user.save();
    }
    res.json("Logged out");
  } catch (err) {
    res.status(500).json(err.message);
  }
});

// Best-effort logout for sub admin when tab/window closes.
router.post("/logout-on-close", async (req, res) => {
  try {
    const rawToken =
      req.body?.token ||
      req.headers?.authorization ||
      "";
    if (!rawToken) return res.status(400).json("No token");

    const data = jwt.verify(rawToken, process.env.JWT_SECRET);
    const user = await User.findById(data.id);
    if (!user) return res.status(404).json("User not found");

    const role = user.role === "admin" ? "super_admin" : user.role;
    if (role !== "sub_admin") return res.json("Skipped");

    user.currentSessionId = "";
    user.currentSessionExpiresAt = null;
    await user.save();

    res.json("Logged out");
  } catch (err) {
    res.status(200).json("Skipped");
  }
});

// Change admin credentials
router.put("/change-credentials", verifyAdmin, verifyPermission("accountSettings"), async (req, res) => {
  try {
    const { currentPassword, newEmail, newPassword, name } = req.body;
    const normalizedNewEmail = normalizeEmail(newEmail);
    const normalizedName = normalizeName(name);

    if (!currentPassword) {
      return res.status(400).json("Current password required");
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json("User not found");

    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) return res.status(400).json("Wrong current password");

    if (newEmail && !isValidEmail(normalizedNewEmail)) {
      return res.status(400).json("Enter a valid email");
    }
    if (newEmail && normalizedNewEmail !== user.email) {
      const exist = await User.findOne({ email: normalizedNewEmail });
      if (exist) return res.status(400).json("Email already in use");
      user.email = normalizedNewEmail;
    }

    if (newPassword) {
      if (!isStrongPassword(newPassword)) {
        return res.status(400).json("New password must be 8+ chars with upper, lower, number and special character");
      }
      const hash = await bcrypt.hash(newPassword, 10);
      user.password = hash;
      const role = user.role === "admin" ? "super_admin" : user.role;
      if (role === "sub_admin") {
        user.currentSessionId = "";
        user.currentSessionExpiresAt = null;
      }
    }

    if (name !== undefined) {
      if (!normalizedName || normalizedName.length < 2) {
        return res.status(400).json("Name must be at least 2 characters");
      }
      user.name = normalizedName;
    }

    await user.save();

    res.json("Credentials updated");
  } catch (err) {
    if (String(err.message || "").includes("Only one super admin is allowed")) {
      return res.status(400).json(err.message);
    }
    res.status(500).json(err.message);
  }
});

router.get("/me", verifyAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json("User not found");
    const role = user.role === "admin" ? "super_admin" : user.role;
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      gender: user.gender || "",
      role,
      permissions:
        role === "super_admin" ? buildPermissions(true) : sanitizeSubAdminPermissions(user.permissions || {}),
      isActive: user.isActive
    });
  } catch (err) {
    res.status(500).json(err.message);
  }
});

// List sub admins
router.get("/admins", verifyAdmin, verifySuperAdmin, async (req, res) => {
  try {
    const admins = await User.find({ role: "sub_admin" });
    admins.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    res.json(
      admins.map(({ password, ...rest }) => rest)
    );
  } catch (err) {
    res.status(500).json(err.message);
  }
});

// Create sub admin (max 3)
router.post("/admins", verifyAdmin, verifySuperAdmin, async (req, res) => {
  try {
    const { name, email, password, permissions, gender } = req.body;
    const normalizedName = normalizeName(name);
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedName || !normalizedEmail || !password) return res.status(400).json("Name, email, password required");
    if (normalizedName.length < 2) return res.status(400).json("Name must be at least 2 characters");
    if (!isValidEmail(normalizedEmail)) return res.status(400).json("Enter a valid email");
    if (!isStrongPassword(password)) {
      return res.status(400).json("Password must be 8+ chars with upper, lower, number and special character");
    }

    const count = await User.countDocuments({ role: "sub_admin" });
    if (count >= 3) return res.status(400).json("Only 3 sub admins allowed");

    const exists = await User.findOne({ email: normalizedEmail });
    if (exists) return res.status(400).json("Email already in use");

    const safePermissions = sanitizeSubAdminPermissions(permissions);

    const hash = await bcrypt.hash(password, 10);
    const subAdmin = await User.create({
      name: normalizedName,
      email: normalizedEmail,
      password: hash,
      role: "sub_admin",
      gender: ["male", "female"].includes(String(gender || "").toLowerCase())
        ? String(gender).toLowerCase()
        : "",
      permissions: safePermissions,
      isActive: true,
      createdBy: req.user.id
    });

    res.json({
      _id: subAdmin._id,
      name: subAdmin.name,
      email: subAdmin.email,
      gender: subAdmin.gender || "",
      role: subAdmin.role,
      permissions: subAdmin.permissions,
      isActive: subAdmin.isActive,
      createdAt: subAdmin.createdAt,
      currentSessionId: subAdmin.currentSessionId || ""
    });
  } catch (err) {
    if (String(err.message || "").includes("Only 3 sub admins allowed")) {
      return res.status(400).json(err.message);
    }
    res.status(500).json(err.message);
  }
});

// Update sub admin
router.put("/admins/:id", verifyAdmin, verifySuperAdmin, async (req, res) => {
  try {
    const target = await User.findById(req.params.id);
    if (!target || target.role !== "sub_admin") return res.status(404).json("Sub admin not found");

    const { name, email, password, permissions, isActive, gender } = req.body;
    const normalizedName = normalizeName(name);
    const normalizedEmail = normalizeEmail(email);

    if (name !== undefined) {
      if (!normalizedName || normalizedName.length < 2) {
        return res.status(400).json("Name must be at least 2 characters");
      }
      target.name = normalizedName;
    }
    if (gender !== undefined) {
      const normalizedGender = String(gender || "").toLowerCase();
      target.gender = ["male", "female"].includes(normalizedGender) ? normalizedGender : "";
    }
    if (email !== undefined) {
      if (!isValidEmail(normalizedEmail)) return res.status(400).json("Enter a valid email");
    }
    if (email !== undefined && normalizedEmail !== target.email) {
      const exists = await User.findOne({ email: normalizedEmail, _id: { $ne: target._id } });
      if (exists) return res.status(400).json("Email already in use");
      target.email = normalizedEmail;
    }

    if (password) {
      if (!isStrongPassword(password)) {
        return res.status(400).json("Password must be 8+ chars with upper, lower, number and special character");
      }
      target.password = await bcrypt.hash(password, 10);
      target.currentSessionId = "";
      target.currentSessionExpiresAt = null;
    }

    if (permissions) {
      target.permissions = sanitizeSubAdminPermissions(permissions);
    }

    if (typeof isActive === "boolean") {
      target.isActive = isActive;
      if (!isActive) {
        target.currentSessionId = "";
        target.currentSessionExpiresAt = null;
      }
    }

    await target.save();
    res.json("Sub admin updated");
  } catch (err) {
    res.status(500).json(err.message);
  }
});

// Force logout sub admin (clear active session lock)
router.post("/admins/:id/force-logout", verifyAdmin, verifySuperAdmin, async (req, res) => {
  try {
    const target = await User.findById(req.params.id);
    if (!target || target.role !== "sub_admin") return res.status(404).json("Sub admin not found");

    target.currentSessionId = "";
    target.currentSessionExpiresAt = null;
    await target.save();

    res.json("Sub admin session cleared");
  } catch (err) {
    res.status(500).json(err.message);
  }
});

// Delete sub admin
router.delete("/admins/:id", verifyAdmin, verifySuperAdmin, async (req, res) => {
  try {
    const target = await User.findById(req.params.id);
    if (!target || target.role !== "sub_admin") return res.status(404).json("Sub admin not found");
    await User.findByIdAndDelete(req.params.id);
    res.json("Sub admin deleted");
  } catch (err) {
    res.status(500).json(err.message);
  }
});

module.exports = router;
