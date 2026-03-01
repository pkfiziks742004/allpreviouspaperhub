import { useEffect, useState } from "react";
import axios from "axios";
import { Navigate, useLocation } from "react-router-dom";
import { PATH_PERMISSION_MAP, hasPermission, getStoredRole } from "../config/permissions";
import { API_BASE } from "../config/api";

export default function PrivateRoute({children}){
  const location = useLocation();
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
    return <Navigate to="/admin/login" />;
  }

  const role = getStoredRole();
  if (!role) {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("permissions");
    return <Navigate to="/admin/login" />;
  }

  const getFallbackPath = () => {
    if (role === "super_admin") return "/admin/dashboard";
    const firstAllowed = PATH_PERMISSION_MAP.find(item => {
      if (item.key === "__super_only__") return false;
      return hasPermission(item.key);
    });
    return firstAllowed ? firstAllowed.pathPrefix : "/admin/login";
  };

  const matched = PATH_PERMISSION_MAP.find(item =>
    location.pathname.startsWith(item.pathPrefix)
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
