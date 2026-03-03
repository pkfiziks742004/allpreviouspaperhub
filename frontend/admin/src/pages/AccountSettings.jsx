import { useState } from "react";
import axios from "axios";
import Layout from "../components/Layout";
import { MdVisibility, MdVisibilityOff } from "react-icons/md";

const API = import.meta.env.VITE_API_BASE || import.meta.env.REACT_APP_API_BASE || "http://localhost:5000";

export default function AccountSettings() {
  const [accountName, setAccountName] = useState("");
  const [accountEmail, setAccountEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [accountSaving, setAccountSaving] = useState(false);

  const token = localStorage.getItem("token");

  const headers = {
    headers: {
      Authorization: token
    }
  };

  const saveAccount = async () => {
    if (!currentPassword) return alert("Enter current password");
    setAccountSaving(true);
    try {
      await axios.put(
        `${API}/api/auth/change-credentials`,
        {
          name: accountName || undefined,
          newEmail: accountEmail || undefined,
          currentPassword,
          newPassword: newPassword || undefined
        },
        headers
      );
      alert("Credentials updated");
      setCurrentPassword("");
      setNewPassword("");
      setShowCurrentPassword(false);
      setShowNewPassword(false);
    } catch (err) {
      const msg = err?.response?.data || err?.message || "Update failed";
      alert(msg);
    } finally {
      setAccountSaving(false);
    }
  };

  return (
    <Layout>

      <div className="card p-4 shadow" style={{ maxWidth: "600px" }}>
        <div className="mb-3">
          <label className="form-label">Name</label>
          <input
            className="form-control"
            value={accountName}
            onChange={e => setAccountName(e.target.value)}
            placeholder="Admin name (optional)"
          />
        </div>

        <div className="mb-3">
          <label className="form-label">New Email</label>
          <input
            type="email"
            className="form-control"
            value={accountEmail}
            onChange={e => setAccountEmail(e.target.value)}
            placeholder="New email (optional)"
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Current Password</label>
          <div className="input-group">
            <input
              type={showCurrentPassword ? "text" : "password"}
              className="form-control"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              placeholder="Current password"
            />
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => setShowCurrentPassword(v => !v)}
              title={showCurrentPassword ? "Hide password" : "Show password"}
              aria-label={showCurrentPassword ? "Hide password" : "Show password"}
            >
              {showCurrentPassword ? <MdVisibilityOff /> : <MdVisibility />}
            </button>
          </div>
        </div>

        <div className="mb-3">
          <label className="form-label">New Password</label>
          <div className="input-group">
            <input
              type={showNewPassword ? "text" : "password"}
              className="form-control"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="New password (optional)"
            />
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => setShowNewPassword(v => !v)}
              title={showNewPassword ? "Hide password" : "Show password"}
              aria-label={showNewPassword ? "Hide password" : "Show password"}
            >
              {showNewPassword ? <MdVisibilityOff /> : <MdVisibility />}
            </button>
          </div>
        </div>

        <button className="btn btn-outline-primary" onClick={saveAccount} disabled={accountSaving}>
          {accountSaving ? "Updating..." : "Update Credentials"}
        </button>
      </div>
    </Layout>
  );
}

