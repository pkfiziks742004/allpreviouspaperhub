import { useEffect, useState } from "react";
import axios from "axios";
import Layout from "../components/Layout";
const API = process.env.REACT_APP_API_BASE || "http://localhost:5000";

export default function SearchTracker() {
  const [keywords, setKeywords] = useState([]);
  const [input, setInput] = useState("");
  const token = localStorage.getItem("token");
  const headers = { headers: { Authorization: token } };

  const fetchKeywords = async () => {
    try {
      const res = await axios.get(`${API}/api/settings`);
      setKeywords(Array.isArray(res.data?.searchKeywords) ? res.data.searchKeywords : []);
    } catch {
      // keep current UI state
    }
  };

  useEffect(() => {
    fetchKeywords();
    const stream = new EventSource(`${API}/api/settings/stream`);
    stream.onmessage = () => fetchKeywords();
    stream.onerror = () => {
      // stream can reconnect automatically
    };
    return () => stream.close();
  }, []);

  const save = async next => {
    setKeywords(next);
    await axios.put(`${API}/api/settings`, { searchKeywords: next }, headers);
  };

  const addKeyword = async e => {
    e.preventDefault();
    const value = input.trim();
    if (!value) return;
    const existing = keywords.find(item => item.term.toLowerCase() === value.toLowerCase());
    if (existing) {
      const next = keywords.map(item =>
        item.term.toLowerCase() === value.toLowerCase()
          ? { ...item, count: item.count + 1, updatedAt: new Date().toISOString() }
          : item
      );
      await save(next);
    } else {
      await save([{ term: value, count: 1, updatedAt: new Date().toISOString() }, ...keywords]);
    }
    setInput("");
  };

  return (
    <Layout>
      <p className="text-muted">Live keyword tracker active hai. Data auto refresh hota rahega.</p>
      <form className="d-flex gap-2 mb-3" onSubmit={addKeyword}>
        <input
          className="form-control"
          placeholder='Example: "dbms btech 3rd sem aktu"'
          value={input}
          onChange={e => setInput(e.target.value)}
        />
        <button className="btn btn-primary" type="submit">Add</button>
      </form>
      <div className="card">
        <div className="card-body">
          <h5 className="mb-3">Tracked Keywords</h5>
          {keywords.length === 0 ? <p className="text-muted mb-0">No keywords tracked yet.</p> : (
            <div className="table-responsive">
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th>Keyword</th>
                    <th>Count</th>
                    <th>Last Source</th>
                    <th>Source Stats</th>
                    <th>Last Seen</th>
                  </tr>
                </thead>
                <tbody>
                  {keywords
                    .slice()
                    .sort((a, b) => b.count - a.count)
                    .map(item => (
                      <tr key={item.term}>
                        <td>{item.term}</td>
                        <td>{item.count}</td>
                        <td>{item.lastSource || "-"}</td>
                        <td>
                          {item.sources && typeof item.sources === "object"
                            ? Object.entries(item.sources)
                                .map(([src, count]) => `${src}: ${count}`)
                                .join(" | ")
                            : "-"}
                        </td>
                        <td>{new Date(item.updatedAt).toLocaleString()}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
