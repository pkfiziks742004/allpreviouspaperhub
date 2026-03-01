const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { buildPermissions } = require("../constants/adminPermissions");

const normalizeRole = role => (role === "admin" ? "super_admin" : role);
const sanitizeSubAdminPermissions = permissions => ({
  ...(permissions || {}),
  accountSettings: false
});

exports.verifyAdmin = async (req,res,next)=>{
  const token = req.headers.authorization;

  if(!token) return res.status(401).json("No Token");

  try {
    const data = jwt.verify(token,process.env.JWT_SECRET);
    const user = await User.findById(data.id);
    if (!user || !user.isActive) return res.status(403).json("Admin inactive");

    const role = normalizeRole(user.role);
    if (role !== "super_admin" && role !== "sub_admin") {
      return res.status(403).json("Not Admin");
    }

    if (role === "sub_admin") {
      const now = new Date();
      const tokenSessionId = data.sid || "";
      const activeSessionId = user.currentSessionId || "";
      const activeSessionExpiry = user.currentSessionExpiresAt
        ? new Date(user.currentSessionExpiresAt)
        : null;

      if (!tokenSessionId || !activeSessionId || tokenSessionId !== activeSessionId) {
        return res.status(403).json("Session expired. Please login again.");
      }

      if (!activeSessionExpiry || activeSessionExpiry <= now) {
        user.currentSessionId = "";
        user.currentSessionExpiresAt = null;
        await user.save();
        return res.status(403).json("Session expired. Please login again.");
      }
    }

    req.user = {
      id: user._id,
      role,
      permissions:
        role === "super_admin" ? buildPermissions(true) : sanitizeSubAdminPermissions(user.permissions || {})
    };
    next();
  } catch (err) {
    return res.status(403).json("Invalid Token");
  }
};

exports.verifySuperAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "super_admin") {
    return res.status(403).json("Only super admin allowed");
  }
  next();
};

exports.verifyPermission = permissionKey => (req, res, next) => {
  if (!req.user) return res.status(403).json("Unauthorized");
  if (req.user.role === "sub_admin" && permissionKey === "accountSettings") {
    return res.status(403).json("No permission");
  }
  if (req.user.role === "super_admin") return next();
  if (req.user.permissions && req.user.permissions[permissionKey]) return next();
  return res.status(403).json("No permission");
};

exports.verifyAnyPermission = permissionKeys => (req, res, next) => {
  if (!req.user) return res.status(403).json("Unauthorized");
  if (req.user.role === "super_admin") return next();
  if (!Array.isArray(permissionKeys) || permissionKeys.length === 0) {
    return res.status(403).json("No permission");
  }
  const allowed = permissionKeys.some(key => req.user.permissions && req.user.permissions[key]);
  if (allowed) return next();
  return res.status(403).json("No permission");
};
