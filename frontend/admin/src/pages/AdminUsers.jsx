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

const buildPermissionState = (value = false) =>
  ADMIN_PERMISSIONS.reduce((acc, item) => {
    acc[item.key] = value;
    return acc;
  }, {});
const ASSIGNABLE_PERMISSIONS = ADMIN_PERMISSIONS.filter(item => item.key !== "accountSettings");

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

  const createSubAdmin = async () => {
    if (!form.name || !form.email || !form.password) {
      return alert("Name, email, password required");
    }
    try {
      await axios.post(`${API}/api/auth/admins`, { ...form, permissions }, headers);
      setForm(blankForm);
      setPermissions(buildPermissionState(true));
      await load();
      alert("Sub admin created");
    } catch (err) {
      alert(err?.response?.data || "Create failed");
    }
  };

  const updateSubAdmin = async user => {
    try {
      await axios.put(
        `${API}/api/auth/admins/${user._id}`,
        {
          name: user.name,
          email: user.email,
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
        <div className="fw-bold mb-2">Create Sub Admin (Max 3)</div>
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
        <div className="form-text mb-2">Password must be at least 8 characters.</div>

        <div className="border rounded p-3 mb-3">
          <div className="fw-semibold mb-2">Access Control</div>
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

        <button className="btn btn-primary" onClick={createSubAdmin}>
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

                <div className="fw-semibold mb-2">Access Control</div>
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
