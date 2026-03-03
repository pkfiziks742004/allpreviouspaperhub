import { useEffect, useState } from "react";
import axios from "axios";
import Layout from "../components/Layout";
const API = import.meta.env.VITE_API_BASE || import.meta.env.REACT_APP_API_BASE || "http://localhost:5000";

export default function FeedbackRequests() {
  const [requests, setRequests] = useState([]);
  const [text, setText] = useState("");
  const token = localStorage.getItem("token");
  const headers = { headers: { Authorization: token } };

  const fetchRequests = async () => {
    try {
      const res = await axios.get(`${API}/api/settings`);
      setRequests(Array.isArray(res.data?.feedbackRequests) ? res.data.feedbackRequests : []);
    } catch {
      // keep current UI state
    }
  };

  useEffect(() => {
    fetchRequests();
    const stream = new EventSource(`${API}/api/settings/stream`);
    stream.onmessage = () => fetchRequests();
    stream.onerror = () => {
      // stream can reconnect automatically
    };
    return () => stream.close();
  }, []);

  const save = async next => {
    setRequests(next);
    await axios.put(`${API}/api/settings`, { feedbackRequests: next }, headers);
  };

  const addRequest = async e => {
    e.preventDefault();
    const value = text.trim();
    if (!value) return;
    await save([
      {
        id: crypto.randomUUID(),
        text: value,
        status: "pending",
        highlight: false,
        createdAt: new Date().toISOString()
      },
      ...requests
    ]);
    setText("");
  };

  const markComplete = id => {
    save(requests.map(item => (item.id === id ? { ...item, status: "completed" } : item)));
  };

  const toggleHighlight = id => {
    save(requests.map(item => (item.id === id ? { ...item, highlight: !item.highlight } : item)));
  };

  const remove = id => save(requests.filter(item => item.id !== id));

  return (
    <Layout>
      <p className="text-muted">User request tracker live mode me hai. Changes auto sync honge.</p>
      <form className="d-flex gap-2 mb-3" onSubmit={addRequest}>
        <input
          className="form-control"
          placeholder='Example: "Physics 2nd sem paper upload karo"'
          value={text}
          onChange={e => setText(e.target.value)}
        />
        <button className="btn btn-primary" type="submit">Add</button>
      </form>

      <div className="card">
        <div className="card-body">
          <h5 className="mb-3">Requests</h5>
          {requests.length === 0 ? <p className="text-muted mb-0">No requests yet.</p> : requests.map(item => (
            <div
              key={item.id}
              className={`border rounded p-2 mb-2 ${item.highlight ? "border-warning bg-warning-subtle" : ""}`}
            >
              <div className="d-flex justify-content-between align-items-start gap-2">
                <div>
                  <div className="fw-semibold">{item.text}</div>
                  <small className="text-muted">
                    {item.status} | source: {item.source || "manual"} | {new Date(item.createdAt).toLocaleString()}
                  </small>
                </div>
                <div className="d-flex gap-2">
                  <button className="btn btn-sm btn-outline-success" onClick={() => markComplete(item.id)}>
                    Complete
                  </button>
                  <button className="btn btn-sm btn-outline-warning" onClick={() => toggleHighlight(item.id)}>
                    Highlight
                  </button>
                  <button className="btn btn-sm btn-outline-danger" onClick={() => remove(item.id)}>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
