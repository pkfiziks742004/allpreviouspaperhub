import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import Layout from "../components/Layout";
import { ADMIN_PERMISSIONS } from "../config/permissions";

const API = import.meta.env.VITE_API_BASE || import.meta.env.REACT_APP_API_BASE || "http://localhost:5000";
const PAGE_SIZE = 5;

const blankForm = {
  name: "",
  email: "",
  password: "",
  gender: ""
};
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

const buildPermissionState = (value = false) =>
  ADMIN_PERMISSIONS.reduce((acc, item) => {
    acc[item.key] = value;
    return acc;
  }, {});
const ASSIGNABLE_PERMISSIONS = ADMIN_PERMISSIONS.filter(item => item.key !== "accountSettings");
const CONTENT_KEYS = ["dashboard", "universities", "courses", "semesters", "papers", "courseSections"];
const SETTINGS_KEYS = [
  "websiteSettings",
  "headerSettings",
  "bannerSettings",
  "universitySettings",
  "courseSettings",
  "questionPaperSettings",
  "semesterSettings",
  "footerSettings",
  "pages",
  "cardSettings",
  "trafficSettings",
  "adsSettings",
  "ratings"
];

const applyPermissionPreset = (preset, current) => {
  const next = buildPermissionState(false);
  if (preset === "all") {
    return ASSIGNABLE_PERMISSIONS.reduce((acc, item) => ({ ...acc, [item.key]: true }), next);
  }
  if (preset === "content") {
    CONTENT_KEYS.forEach(key => {
      next[key] = true;
    });
    return next;
  }
  if (preset === "settings") {
    SETTINGS_KEYS.forEach(key => {
      next[key] = true;
    });
    return next;
  }
  if (preset === "copy-current") {
    return { ...next, ...(current || {}), accountSettings: false };
  }
  return next;
};

const countEnabledPermissions = permissions =>
  ASSIGNABLE_PERMISSIONS.reduce((acc, item) => acc + (permissions?.[item.key] ? 1 : 0), 0);

const normalizeName = value => String(value || "").trim().replace(/\s+/g, " ");

export default function AdminUsers() {
  const [list, setList] = useState([]);
  const [form, setForm] = useState(blankForm);
  const [permissions, setPermissions] = useState(buildPermissionState(true));
  const [loading, setLoading] = useState(true);
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [showPasswords, setShowPasswords] = useState({});
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [genderFilter, setGenderFilter] = useState("all");
  const [page, setPage] = useState(1);

  const token = localStorage.getItem("token");
  const headers = useMemo(() => ({ headers: { Authorization: token } }), [token]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/api/auth/admins`, headers);
      setList((res.data || []).map(item => ({ ...item, resetPassword: "" })));
    } catch (err) {
      alert(err?.response?.data || "Failed to load sub admins");
    } finally {
      setLoading(false);
    }
  }, [headers]);

  useEffect(() => {
    load();
  }, [load]);

  const filteredList = useMemo(() => {
    const term = searchText.trim().toLowerCase();
    return list.filter(item => {
      const matchesText =
        !term ||
        (item.name || "").toLowerCase().includes(term) ||
        (item.email || "").toLowerCase().includes(term);
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && !!item.isActive) ||
        (statusFilter === "inactive" && !item.isActive);
      const g = String(item.gender || "").toLowerCase();
      const matchesGender =
        genderFilter === "all" ||
        (genderFilter === "male" && g === "male") ||
        (genderFilter === "female" && g === "female") ||
        (genderFilter === "unspecified" && !g);
      return matchesText && matchesStatus && matchesGender;
    });
  }, [list, searchText, statusFilter, genderFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredList.length / PAGE_SIZE));
  const pagedList = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredList.slice(start, start + PAGE_SIZE);
  }, [filteredList, page]);

  useEffect(() => {
    setPage(1);
  }, [searchText, statusFilter, genderFilter]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const subAdminStats = useMemo(() => {
    const total = list.length;
    const active = list.filter(item => !!item.isActive).length;
    const inactive = total - active;
    const loggedIn = list.filter(item => !!item.currentSessionId).length;
    return { total, active, inactive, loggedIn };
  }, [list]);

  const validateCreate = () => {
    const cleanedName = normalizeName(form.name);
    if (cleanedName.length < 2) return "Name must be at least 2 characters";
    if (!EMAIL_REGEX.test(String(form.email || "").trim())) return "Enter a valid email";
    if (!STRONG_PASSWORD_REGEX.test(String(form.password || ""))) {
      return "Password: 8+ chars, upper, lower, number, special required";
    }
    return "";
  };

  const validateUpdate = user => {
    const cleanedName = normalizeName(user.name);
    if (cleanedName.length < 2) return "Name must be at least 2 characters";
    if (!EMAIL_REGEX.test(String(user.email || "").trim())) return "Enter a valid email";
    if (user.resetPassword && !STRONG_PASSWORD_REGEX.test(String(user.resetPassword || ""))) {
      return "Reset password must be strong (8+, upper, lower, number, special)";
    }
    return "";
  };

  const createSubAdmin = async () => {
    const validationError = validateCreate();
    if (validationError) {
      return alert(validationError);
    }
    if (list.length >= 3) {
      return alert("Only 3 sub admins allowed");
    }
    try {
      await axios.post(
        `${API}/api/auth/admins`,
        {
          ...form,
          name: normalizeName(form.name),
          email: String(form.email || "").trim(),
          permissions
        },
        headers
      );
      setForm(blankForm);
      setPermissions(buildPermissionState(true));
      await load();
      alert("Sub admin created");
    } catch (err) {
      alert(err?.response?.data || "Create failed");
    }
  };

  const updateSubAdmin = async user => {
    const validationError = validateUpdate(user);
    if (validationError) {
      return alert(validationError);
    }
    try {
      await axios.put(
        `${API}/api/auth/admins/${user._id}`,
        {
          name: normalizeName(user.name),
          email: String(user.email || "").trim(),
          gender: user.gender || "",
          password: user.resetPassword || undefined,
          isActive: user.isActive,
          permissions: user.permissions || {}
        },
        headers
      );
      setList(prev => prev.map(p => (p._id === user._id ? { ...p, resetPassword: "" } : p)));
      alert("Updated");
    } catch (err) {
      alert(err?.response?.data || "Update failed");
    }
  };

  const removeSubAdmin = async id => {
    if (!window.confirm("Delete sub admin?")) return;
    try {
      await axios.delete(`${API}/api/auth/admins/${id}`, headers);
      await load();
    } catch (err) {
      alert(err?.response?.data || "Delete failed");
    }
  };

  const forceLogoutSubAdmin = async id => {
    if (!window.confirm("Force logout this sub admin?")) return;
    try {
      await axios.post(`${API}/api/auth/admins/${id}/force-logout`, {}, headers);
      alert("Sub admin forced logout");
      await load();
    } catch (err) {
      alert(err?.response?.data || "Force logout failed");
    }
  };

  return (
    <Layout>
      <div className="card p-4 shadow mb-4" style={{ maxWidth: "980px" }}>
        <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
          <div className="fw-bold">Create Sub Admin (Max 3)</div>
          <div className="small text-muted">
            Slots left: {Math.max(0, 3 - list.length)}
          </div>
        </div>
        <div className="row g-2 mb-3">
          <div className="col-md-3 col-6">
            <div className="border rounded p-2 bg-white">
              <div className="text-muted small">Total</div>
              <div className="fw-semibold">{subAdminStats.total}</div>
            </div>
          </div>
          <div className="col-md-3 col-6">
            <div className="border rounded p-2 bg-white">
              <div className="text-muted small">Active</div>
              <div className="fw-semibold text-success">{subAdminStats.active}</div>
            </div>
          </div>
          <div className="col-md-3 col-6">
            <div className="border rounded p-2 bg-white">
              <div className="text-muted small">Inactive</div>
              <div className="fw-semibold text-danger">{subAdminStats.inactive}</div>
            </div>
          </div>
          <div className="col-md-3 col-6">
            <div className="border rounded p-2 bg-white">
              <div className="text-muted small">Logged In</div>
              <div className="fw-semibold text-primary">{subAdminStats.loggedIn}</div>
            </div>
          </div>
        </div>
        <div className="row g-2 mb-2">
          <div className="col-md-3">
            <input
              className="form-control"
              placeholder="Name"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="col-md-3">
            <input
              className="form-control"
              placeholder="Email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div className="col-md-3">
            <select
              className="form-select"
              value={form.gender}
              onChange={e => setForm({ ...form, gender: e.target.value })}
            >
              <option value="">Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
          <div className="col-md-3">
            <input
              type={showCreatePassword ? "text" : "password"}
              className="form-control"
              placeholder="Password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
            />
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary mt-1"
              onClick={() => setShowCreatePassword(prev => !prev)}
            >
              {showCreatePassword ? "Hide Password" : "Show Password"}
            </button>
          </div>
        </div>
        <div className="form-text mb-2">
          Password policy: at least 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special character.
        </div>

        <div className="border rounded p-3 mb-3">
          <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
            <div className="fw-semibold">Access Control</div>
            <div className="small text-muted">
              Enabled: {countEnabledPermissions(permissions)} / {ASSIGNABLE_PERMISSIONS.length}
            </div>
          </div>
          <div className="d-flex gap-2 flex-wrap mb-2">
            <button
              type="button"
              className="btn btn-sm btn-outline-primary"
              onClick={() => setPermissions(applyPermissionPreset("all", permissions))}
            >
              Select All
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline-primary"
              onClick={() => setPermissions(applyPermissionPreset("content", permissions))}
            >
              Content Preset
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline-primary"
              onClick={() => setPermissions(applyPermissionPreset("settings", permissions))}
            >
              Settings Preset
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={() => setPermissions(applyPermissionPreset("none", permissions))}
            >
              Clear All
            </button>
          </div>
          <div className="row">
            {ASSIGNABLE_PERMISSIONS.map(item => (
              <div className="col-md-4 col-sm-6 mb-2" key={item.key}>
                <div className="form-check">
                  <input
                    id={`new-${item.key}`}
                    className="form-check-input"
                    type="checkbox"
                    checked={!!permissions[item.key]}
                    onChange={e => setPermissions({ ...permissions, [item.key]: e.target.checked })}
                  />
                  <label htmlFor={`new-${item.key}`} className="form-check-label">
                    {item.label}
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button className="btn btn-primary" onClick={createSubAdmin} disabled={list.length >= 3}>
          Add Sub Admin
        </button>
      </div>

      <div className="card p-4 shadow" style={{ maxWidth: "1150px" }}>
        <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
          <div className="fw-bold">Existing Sub Admins</div>
          <div className="d-flex gap-2 flex-wrap">
            <input
              className="form-control"
              style={{ minWidth: "220px" }}
              placeholder="Search by name/email"
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
            />
            <select className="form-select" value={genderFilter} onChange={e => setGenderFilter(e.target.value)}>
              <option value="all">All Genders</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="unspecified">Unspecified</option>
            </select>
            <select className="form-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-muted">Loading...</div>
        ) : filteredList.length === 0 ? (
          <div className="text-muted">No sub admin found.</div>
        ) : (
          <>
            {pagedList.map(user => (
              <div className="border rounded p-3 mb-3 bg-white" key={user._id}>
                <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
                  <div className="d-flex align-items-center gap-2 flex-wrap">
                    <span className={`badge ${user.isActive ? "text-bg-success" : "text-bg-secondary"}`}>
                      {user.isActive ? "Active" : "Inactive"}
                    </span>
                    <span className={`badge ${user.currentSessionId ? "text-bg-primary" : "text-bg-light"}`}>
                      {user.currentSessionId ? "Logged in" : "Logged out"}
                    </span>
                  </div>
                  <div className="small text-muted">
                    Permissions: {countEnabledPermissions(user.permissions || {})} / {ASSIGNABLE_PERMISSIONS.length}
                  </div>
                </div>

                <div className="row g-2 mb-2">
                  <div className="col-md-3">
                    <label className="form-label mb-1">Name</label>
                    <input
                      className="form-control"
                      value={user.name || ""}
                      onChange={e =>
                        setList(prev => prev.map(p => (p._id === user._id ? { ...p, name: e.target.value } : p)))
                      }
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label mb-1">Email</label>
                    <input
                      className="form-control"
                      value={user.email || ""}
                      onChange={e =>
                        setList(prev => prev.map(p => (p._id === user._id ? { ...p, email: e.target.value } : p)))
                      }
                    />
                  </div>
                  <div className="col-md-2">
                    <label className="form-label mb-1">Gender</label>
                    <select
                      className="form-select"
                      value={user.gender || ""}
                      onChange={e =>
                        setList(prev => prev.map(p => (p._id === user._id ? { ...p, gender: e.target.value } : p)))
                      }
                    >
                      <option value="">Unspecified</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>
                  <div className="col-md-1 d-flex align-items-end">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={!!user.isActive}
                        onChange={e =>
                          setList(prev =>
                            prev.map(p => (p._id === user._id ? { ...p, isActive: e.target.checked } : p))
                          )
                        }
                      />
                      <label className="form-check-label">Active</label>
                    </div>
                  </div>
                  <div className="col-md-3 d-flex gap-2 align-items-end">
                    <button className="btn btn-sm btn-success w-100" onClick={() => updateSubAdmin(user)}>
                      Save
                    </button>
                    <button className="btn btn-sm btn-warning w-100" onClick={() => forceLogoutSubAdmin(user._id)}>
                      Force Logout
                    </button>
                    <button className="btn btn-sm btn-danger w-100" onClick={() => removeSubAdmin(user._id)}>
                      Delete
                    </button>
                  </div>
                </div>

                <div className="row g-2 mb-2">
                  <div className="col-md-4">
                    <label className="form-label mb-1">Reset Password (Super Admin)</label>
                    <input
                      type={showPasswords[user._id] ? "text" : "password"}
                      className="form-control"
                      placeholder="New password (optional)"
                      value={user.resetPassword || ""}
                      onChange={e =>
                        setList(prev =>
                          prev.map(p => (p._id === user._id ? { ...p, resetPassword: e.target.value } : p))
                        )
                      }
                    />
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary mt-1"
                      onClick={() => setShowPasswords(prev => ({ ...prev, [user._id]: !prev[user._id] }))}
                    >
                      {showPasswords[user._id] ? "Hide Password" : "Show Password"}
                    </button>
                  </div>
                  <div className="col-md-2">
                    <label className="form-label mb-1">Role</label>
                    <input className="form-control" value="Sub Admin" disabled />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label mb-1">Created</label>
                    <input
                      className="form-control"
                      value={user.createdAt ? new Date(user.createdAt).toLocaleString() : "-"}
                      disabled
                    />
                  </div>
                  <div className="col-md-3">
                    <label className="form-label mb-1">Session Status</label>
                    <input
                      className="form-control"
                      value={user.currentSessionId ? "Logged in" : "Logged out"}
                      disabled
                    />
                  </div>
                </div>

                <div className="form-text mb-2">Add new password and click Save to change sub admin password.</div>

                <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
                  <div className="fw-semibold">Access Control</div>
                  <div className="d-flex gap-2 flex-wrap">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-primary"
                      onClick={() =>
                        setList(prev =>
                          prev.map(p =>
                            p._id === user._id
                              ? { ...p, permissions: applyPermissionPreset("all", p.permissions || {}) }
                              : p
                          )
                        )
                      }
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-primary"
                      onClick={() =>
                        setList(prev =>
                          prev.map(p =>
                            p._id === user._id
                              ? { ...p, permissions: applyPermissionPreset("content", p.permissions || {}) }
                              : p
                          )
                        )
                      }
                    >
                      Content
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-primary"
                      onClick={() =>
                        setList(prev =>
                          prev.map(p =>
                            p._id === user._id
                              ? { ...p, permissions: applyPermissionPreset("settings", p.permissions || {}) }
                              : p
                          )
                        )
                      }
                    >
                      Settings
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() =>
                        setList(prev =>
                          prev.map(p =>
                            p._id === user._id
                              ? { ...p, permissions: applyPermissionPreset("none", p.permissions || {}) }
                              : p
                          )
                        )
                      }
                    >
                      Clear
                    </button>
                  </div>
                </div>
                <div className="row">
                  {ASSIGNABLE_PERMISSIONS.map(item => (
                    <div className="col-md-4 col-sm-6 mb-2" key={`${user._id}-${item.key}`}>
                      <div className="form-check">
                        <input
                          id={`${user._id}-${item.key}`}
                          className="form-check-input"
                          type="checkbox"
                          checked={!!user.permissions?.[item.key]}
                          onChange={e =>
                            setList(prev =>
                              prev.map(p =>
                                p._id === user._id
                                  ? {
                                      ...p,
                                      permissions: {
                                        ...(p.permissions || {}),
                                        [item.key]: e.target.checked
                                      }
                                    }
                                  : p
                              )
                            )
                          }
                        />
                        <label htmlFor={`${user._id}-${item.key}`} className="form-check-label">
                          {item.label}
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="d-flex justify-content-between align-items-center mt-2">
              <small className="text-muted">
                Showing {(page - 1) * PAGE_SIZE + 1}-
                {Math.min(page * PAGE_SIZE, filteredList.length)} of {filteredList.length}
              </small>
              <div className="btn-group">
                <button
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Prev
                </button>
                <button className="btn btn-sm btn-outline-secondary" disabled>
                  {page} / {totalPages}
                </button>
                <button
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
