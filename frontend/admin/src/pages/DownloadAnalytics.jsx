import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Layout from "../components/Layout";
import { API_BASE } from "../config/api";

export default function DownloadAnalytics() {
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get(`${API_BASE}/api/papers`)
      .then(res => setPapers(Array.isArray(res.data) ? res.data : []))
      .catch(() => setPapers([]))
      .finally(() => setLoading(false));
  }, []);

  const metrics = useMemo(() => {
    const totalPapers = papers.length;
    const totalDownloads = papers.reduce((sum, item) => sum + Number(item.downloads || 0), 0);
    const topPaper = [...papers].sort((a, b) => Number(b.downloads || 0) - Number(a.downloads || 0))[0] || null;
    const latestPaper = [...papers].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))[0] || null;
    return { totalPapers, totalDownloads, topPaper, latestPaper };
  }, [papers]);

  return (
    <Layout>
      <p className="text-muted mb-4">Download behavior and popular papers ka quick analytics.</p>

      <div className="row g-3 mb-4">
        <div className="col-md-3"><div className="stat-card"><div className="stat-label">Total Papers</div><div className="stat-value">{metrics.totalPapers}</div></div></div>
        <div className="col-md-3"><div className="stat-card"><div className="stat-label">Total Downloads</div><div className="stat-value">{metrics.totalDownloads}</div></div></div>
        <div className="col-md-3"><div className="stat-card"><div className="stat-label">Top Paper</div><div className="stat-meta">{metrics.topPaper ? metrics.topPaper.title : "-"}</div></div></div>
        <div className="col-md-3"><div className="stat-card"><div className="stat-label">Latest Upload</div><div className="stat-meta">{metrics.latestPaper ? metrics.latestPaper.title : "-"}</div></div></div>
      </div>

      <div className="card">
        <div className="card-body">
          <h5 className="mb-3">Paper Download Table</h5>
          {loading ? <p className="text-muted mb-0">Loading...</p> : (
            <div className="table-responsive">
              <table className="table table-sm align-middle">
                <thead>
                  <tr>
                    <th>Paper</th>
                    <th>Year</th>
                    <th>Downloads</th>
                    <th>Uploaded</th>
                  </tr>
                </thead>
                <tbody>
                  {papers
                    .slice()
                    .sort((a, b) => Number(b.downloads || 0) - Number(a.downloads || 0))
                    .map(item => (
                      <tr key={item._id}>
                        <td>{item.title || "-"}</td>
                        <td>{item.year || "-"}</td>
                        <td>{item.downloads || 0}</td>
                        <td>{item.createdAt ? new Date(item.createdAt).toLocaleString() : "-"}</td>
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
