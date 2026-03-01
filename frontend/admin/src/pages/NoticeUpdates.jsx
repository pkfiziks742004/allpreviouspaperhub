import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Layout from "../components/Layout";
const API = process.env.REACT_APP_API_BASE || "http://localhost:5000";

export default function NoticeUpdates() {
  const [notices, setNotices] = useState([]);
  const [form, setForm] = useState({
    title: "",
    type: "new-paper",
    pinTop: false,
    expiresAt: ""
  });
  const token = localStorage.getItem("token");
  const headers = { headers: { Authorization: token } };

  const fetchNotices = async () => {
    try {
      const res = await axios.get(`${API}/api/settings`);
      setNotices(Array.isArray(res.data?.noticeUpdates) ? res.data.noticeUpdates : []);
    } catch {
      // keep current UI state
    }
  };

  useEffect(() => {
    fetchNotices();
    const stream = new EventSource(`${API}/api/settings/stream`);
    stream.onmessage = () => fetchNotices();
    stream.onerror = () => {
      // stream can reconnect automatically
    };
    return () => stream.close();
  }, []);

  const saveNotices = async next => {
    setNotices(next);
    await axios.put(`${API}/api/settings`, { noticeUpdates: next }, headers);
  };

  const addNotice = async e => {
    e.preventDefault();
    const title = form.title.trim();
    if (!title) return;
    const next = [
      {
        id: crypto.randomUUID(),
        title,
        type: form.type,
        pinTop: form.pinTop,
        expiresAt: form.expiresAt || "",
        createdAt: new Date().toISOString()
      },
      ...notices
    ];
    await saveNotices(next);
    setForm({ title: "", type: "new-paper", pinTop: false, expiresAt: "" });
  };

  const removeNotice = id => saveNotices(notices.filter(item => item.id !== id));

  const activeCount = useMemo(() => {
    const now = new Date();
    return notices.filter(item => !item.expiresAt || new Date(item.expiresAt) >= now).length;
  }, [notices]);

  return (
    <Layout>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <p className="text-muted mb-0">Admit card, result, exam form, new paper alerts yahin manage karo.</p>
        <span className="badge bg-primary">Active: {activeCount}</span>
      </div>

      <div className="card mb-4">
        <div className="card-body">
          <h5 className="mb-3">Create Notice</h5>
          <form className="row g-3" onSubmit={addNotice}>
            <div className="col-md-5">
              <input
                className="form-control"
                placeholder="Notice text"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="col-md-3">
              <select
                className="form-select"
                value={form.type}
                onChange={e => setForm({ ...form, type: e.target.value })}
              >
                <option value="admit-card">Admit Card</option>
                <option value="result">Result</option>
                <option value="exam-form">Exam Form</option>
                <option value="new-paper">New Paper Added</option>
              </select>
            </div>
            <div className="col-md-2">
              <input
                type="date"
                className="form-control"
                value={form.expiresAt}
                onChange={e => setForm({ ...form, expiresAt: e.target.value })}
              />
            </div>
            <div className="col-md-2 d-flex align-items-center gap-2">
              <input
                type="checkbox"
                checked={form.pinTop}
                onChange={e => setForm({ ...form, pinTop: e.target.checked })}
              />
              <span>Pin Top</span>
            </div>
            <div className="col-12">
              <button className="btn btn-primary" type="submit">Add Notice</button>
            </div>
          </form>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <h5 className="mb-3">Notice List</h5>
          {notices.length === 0 && <p className="text-muted mb-0">No notices yet.</p>}
          {notices.map(item => (
            <div key={item.id} className="d-flex justify-content-between align-items-center border-bottom py-2">
              <div>
                <div className="fw-semibold">{item.title}</div>
                <small className="text-muted">
                  {item.type} | pin: {item.pinTop ? "yes" : "no"} | expire: {item.expiresAt || "none"}
                </small>
              </div>
              <button className="btn btn-sm btn-outline-danger" onClick={() => removeNotice(item.id)}>
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
