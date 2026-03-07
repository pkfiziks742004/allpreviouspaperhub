import { useEffect, useState } from "react";
import axios from "axios";
import { Navigate, useLocation } from "react-router-dom";
import { PATH_PERMISSION_MAP, hasPermission, getStoredRole } from "../config/permissions";
import { API_BASE } from "../config/api";

const getRouteBaseFromPath = pathname =>
  pathname.startsWith("/sub-admin") ? "/sub-admin" : "/admin";

const normalizePathname = pathname => {
  const trimmed = pathname.replace(/^\/(admin|sub-admin)/, "");
  return trimmed || "/";
};

export default function PrivateRoute({children}){
  const location = useLocation();
  const routeBase = getRouteBaseFromPath(location.pathname);
  const [ready, setReady] = useState(false);
  const [authOk, setAuthOk] = useState(true);

  const token = localStorage.getItem("token");

  useEffect(() => {
    let alive = true;
    const syncAuth = async () => {
      if (!token) {
        if (!alive) return;
        setAuthOk(false);
        setReady(true);
        return;
      }
      try {
        const res = await axios.get(`${API_BASE}/api/auth/me`, {
          headers: { Authorization: token }
        });
        if (!alive) return;
        localStorage.setItem("role", res.data.role || "");
        localStorage.setItem("permissions", JSON.stringify(res.data.permissions || {}));
        setAuthOk(true);
      } catch (err) {
        if (!alive) return;
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        localStorage.removeItem("permissions");
        setAuthOk(false);
      } finally {
        if (alive) setReady(true);
      }
    };
    syncAuth();
    return () => {
      alive = false;
    };
  }, [token]);

  if (!ready) {
    return <div className="admin-loading">Loading admin...</div>;
  }

  if (!authOk) {
    return <Navigate to={`${routeBase}/login`} />;
  }

  const role = getStoredRole();
  if (!role) {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("permissions");
    return <Navigate to={`${routeBase}/login`} />;
  }

  const expectedBase = role === "sub_admin" ? "/sub-admin" : "/admin";
  if (location.pathname.startsWith("/admin") || location.pathname.startsWith("/sub-admin")) {
    if (!location.pathname.startsWith(expectedBase)) {
      const nextPath = location.pathname.replace(/^\/(admin|sub-admin)/, expectedBase);
      return <Navigate to={`${nextPath}${location.search}${location.hash}`} replace />;
    }
  }

  const getFallbackPath = () => {
    if (role === "super_admin") return `${expectedBase}/dashboard`;
    const firstAllowed = PATH_PERMISSION_MAP.find(item => {
      if (item.key === "__super_only__") return false;
      return hasPermission(item.key);
    });
    return firstAllowed ? `${expectedBase}${firstAllowed.pathPrefix}` : `${expectedBase}/login`;
  };

  const normalizedPath = normalizePathname(location.pathname);
  const matched = PATH_PERMISSION_MAP.find(item =>
    normalizedPath.startsWith(item.pathPrefix)
  );

  if (matched) {
    if (matched.key === "__super_only__" && role !== "super_admin") {
      return <Navigate to={getFallbackPath()} />;
    }

    if (matched.key !== "__super_only__" && !hasPermission(matched.key)) {
      return <Navigate to={getFallbackPath()} />;
    }
  }

  return children;
}
