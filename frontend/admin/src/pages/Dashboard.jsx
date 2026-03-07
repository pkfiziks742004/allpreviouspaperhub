import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import Layout from "../components/Layout";
import { API_BASE } from "../config/api";
import { getStoredRole } from "../config/permissions";

export default function Dashboard() {
  const basePath = getStoredRole() === "sub_admin" ? "/sub-admin" : "/admin";
  const [stats, setStats] = useState({});
  const [papers, setPapers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [settings, setSettings] = useState({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState(null);

  const fetchDashboard = useCallback(async () => {
    setIsRefreshing(true);
    const token = localStorage.getItem("token");
    const results = await Promise.allSettled([
      axios.get(`${API_BASE}/api/stats`, { headers: { Authorization: token || "" } }),
      axios.get(`${API_BASE}/api/papers`),
      axios.get(`${API_BASE}/api/courses`),
      axios.get(`${API_BASE}/api/settings`)
    ]);

    const [statsRes, papersRes, coursesRes, settingsRes] = results;
    setStats(statsRes.status === "fulfilled" ? statsRes.value.data || {} : {});
    setPapers(
      papersRes.status === "fulfilled" && Array.isArray(papersRes.value.data)
        ? papersRes.value.data
        : []
    );
    setCourses(
      coursesRes.status === "fulfilled" && Array.isArray(coursesRes.value.data)
        ? coursesRes.value.data
        : []
    );
    setSettings(settingsRes.status === "fulfilled" ? settingsRes.value.data || {} : {});
    setLastSyncAt(new Date());
    setIsRefreshing(false);
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  useEffect(() => {
    const timer = setInterval(fetchDashboard, 60000);
    return () => clearInterval(timer);
  }, [fetchDashboard]);

  const dashboard = useMemo(() => {
    const totalPapers = stats.papers ?? papers.length;
    const totalDownloads = papers.reduce((sum, item) => sum + Number(item.downloads || 0), 0);
    const avgDownloadPerPaper = totalPapers > 0 ? Number((totalDownloads / totalPapers).toFixed(2)) : 0;
    const today = new Date();
    const todayKey = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;

    const recentUploads = papers
      .slice()
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 6);
    const latestUploadedPaper = recentUploads[0] || null;
    const topDownloadedPaper =
      papers.slice().sort((a, b) => Number(b.downloads || 0) - Number(a.downloads || 0))[0] || null;
    const todayUploads = papers.filter(item => {
      const date = new Date(item.createdAt || 0);
      return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}` === todayKey;
    }).length;

    const topPapers = papers
      .slice()
      .sort((a, b) => Number(b.downloads || 0) - Number(a.downloads || 0))
      .slice(0, 5);

    const dayLabels = Array.from({ length: 7 }).map((_, idx) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - idx));
      return date;
    });
    const uploadTrend = dayLabels.map(date => {
      const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      const count = papers.filter(item => {
        const d = new Date(item.createdAt || 0);
        return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}` === key;
      }).length;
      return {
        label: date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
        count
      };
    });

    const courseMap = new Map(courses.map(item => [String(item._id), item.name]));
    const courseCounts = papers.reduce((acc, item) => {
      const key = String(item.courseId || "");
      if (!key) return acc;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    const [topCourseId, topCourseCount] =
      Object.entries(courseCounts).sort((a, b) => Number(b[1]) - Number(a[1]))[0] || [];
    const topCourseName = topCourseId ? courseMap.get(topCourseId) || "-" : "-";

    const yearCounts = papers.reduce((acc, item) => {
      const key = item.year ? String(item.year) : "Unknown";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    const [topYear, topYearCount] =
      Object.entries(yearCounts).sort((a, b) => Number(b[1]) - Number(a[1]))[0] || [];

    const papersWithoutYear = papers.filter(item => !item.year).length;

    const feedbackRequests = Array.isArray(settings.feedbackRequests) ? settings.feedbackRequests : [];
    const pendingFeedbackList = feedbackRequests
      .filter(item => String(item?.status || "pending") === "pending")
      .slice(0, 5);
    const pendingFeedback = pendingFeedbackList.length;

    const notices = Array.isArray(settings.noticeUpdates) ? settings.noticeUpdates : [];
    const activeNoticesList = notices.filter(item => {
      if (!item?.expiresAt) return true;
      return new Date(item.expiresAt) >= new Date();
    });
    const activeNotices = activeNoticesList.length;

    const searchKeywords = Array.isArray(settings.searchKeywords) ? settings.searchKeywords : [];
    const searchesToday = searchKeywords.reduce((acc, item) => {
      const updated = new Date(item?.updatedAt || 0);
      const isToday =
        updated.getFullYear() === today.getFullYear() &&
        updated.getMonth() === today.getMonth() &&
        updated.getDate() === today.getDate();
      return acc + (isToday ? Number(item?.count || 0) : 0);
    }, 0);
    const topSearchTerms = searchKeywords
      .slice()
      .sort((a, b) => Number(b?.count || 0) - Number(a?.count || 0))
      .slice(0, 5);

    const avgDailyUploads = Number((papers.length / 7).toFixed(1));
    const maxTrend = Math.max(...uploadTrend.map(item => item.count), 1);

    const alerts = [];
    if (pendingFeedback > 0) alerts.push(`${pendingFeedback} feedback requests pending`);
    if (papersWithoutYear > 0) alerts.push(`${papersWithoutYear} papers missing year`);
    if (activeNotices === 0) alerts.push("No active notice on website");
    if (!latestUploadedPaper) alerts.push("No paper uploaded yet");

    return {
      totalPapers,
      totalDownloads,
      avgDownloadPerPaper,
      todayUploads,
      topDownloadedPaper,
      latestUploadedPaper,
      recentUploads,
      topPapers,
      uploadTrend,
      maxTrend,
      papersWithoutYear,
      topCourseName,
      topCourseCount: Number(topCourseCount || 0),
      topYear: topYear || "-",
      topYearCount: Number(topYearCount || 0),
      pendingFeedback,
      pendingFeedbackList,
      activeNotices,
      searchesToday,
      topSearchTerms,
      avgDailyUploads,
      alerts
    };
  }, [papers, courses, settings, stats.papers]);

  return (
    <Layout>
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
        <p className="text-muted mb-0">Smart admin overview with papers, activity and signal health.</p>
        <div className="d-flex align-items-center gap-2">
          <small className="text-muted">
            Last sync: {lastSyncAt ? lastSyncAt.toLocaleTimeString() : "loading..."}
          </small>
          <button
            type="button"
            className="btn btn-sm btn-primary"
            onClick={fetchDashboard}
            disabled={isRefreshing}
          >
            {isRefreshing ? "Refreshing..." : "Refresh Now"}
          </button>
        </div>
      </div>

      <div className="row mt-4 g-3">
        <div className="col-lg-2 col-md-4 col-6">
          <div className="stat-card">
            <div className="stat-label">Total Papers</div>
            <div className="stat-value">{dashboard.totalPapers}</div>
          </div>
        </div>
        <div className="col-lg-2 col-md-4 col-6">
          <div className="stat-card">
            <div className="stat-label">Total Downloads</div>
            <div className="stat-value">{dashboard.totalDownloads}</div>
          </div>
        </div>
        <div className="col-lg-2 col-md-4 col-6">
          <div className="stat-card">
            <div className="stat-label">Today Uploads</div>
            <div className="stat-value">{dashboard.todayUploads}</div>
          </div>
        </div>
        <div className="col-lg-3 col-md-6">
          <div className="stat-card">
            <div className="stat-label">Top Downloaded</div>
            <div className="stat-meta">{dashboard.topDownloadedPaper?.title || "-"}</div>
          </div>
        </div>
        <div className="col-lg-3 col-md-6">
          <div className="stat-card">
            <div className="stat-label">Latest Uploaded</div>
            <div className="stat-meta">{dashboard.latestUploadedPaper?.title || "-"}</div>
          </div>
        </div>
      </div>

      <div className="row mt-3 g-3">
        <div className="col-lg-3 col-md-6">
          <div className="stat-card">
            <div className="stat-label">Top Course</div>
            <div className="stat-meta">{dashboard.topCourseName}</div>
            <div className="small text-muted mt-1">{dashboard.topCourseCount} papers</div>
          </div>
        </div>
        <div className="col-lg-3 col-md-6">
          <div className="stat-card">
            <div className="stat-label">Top Year</div>
            <div className="stat-meta">{dashboard.topYear}</div>
            <div className="small text-muted mt-1">{dashboard.topYearCount} papers</div>
          </div>
        </div>
        <div className="col-lg-3 col-md-6">
          <div className="stat-card">
            <div className="stat-label">Pending Feedback</div>
            <div className="stat-value">{dashboard.pendingFeedback}</div>
          </div>
        </div>
        <div className="col-lg-3 col-md-6">
          <div className="stat-card">
            <div className="stat-label">Active Notices</div>
            <div className="stat-value">{dashboard.activeNotices}</div>
          </div>
        </div>
      </div>

      <div className="row mt-3 g-3">
        <div className="col-lg-3 col-md-6">
          <div className="stat-card">
            <div className="stat-label">Avg Download/Paper</div>
            <div className="stat-value">{dashboard.avgDownloadPerPaper}</div>
          </div>
        </div>
        <div className="col-lg-3 col-md-6">
          <div className="stat-card">
            <div className="stat-label">Searches Today</div>
            <div className="stat-value">{dashboard.searchesToday}</div>
          </div>
        </div>
        <div className="col-lg-3 col-md-6">
          <div className="stat-card">
            <div className="stat-label">Papers Without Year</div>
            <div className="stat-value">{dashboard.papersWithoutYear}</div>
          </div>
        </div>
        <div className="col-lg-3 col-md-6">
          <div className="stat-card">
            <div className="stat-label">Active Alerts</div>
            <div className="stat-value">{dashboard.alerts.length}</div>
          </div>
        </div>
      </div>

      <div className="row mt-3 g-3">
        <div className="col-lg-6">
          <div className="card h-100">
            <div className="card-body">
              <h5 className="mb-3">Daily Upload Activity (7 days)</h5>
              {dashboard.uploadTrend.map(item => (
                <div key={item.label} className="mb-2">
                  <div className="d-flex justify-content-between small">
                    <span>{item.label}</span>
                    <span>{item.count}</span>
                  </div>
                  <div className="progress" style={{ height: 8 }}>
                    <div
                      className="progress-bar"
                      role="progressbar"
                      style={{ width: `${(item.count / dashboard.maxTrend) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="col-lg-6">
          <div className="card h-100">
            <div className="card-body">
              <h5 className="mb-3">Top Downloaded Papers</h5>
              {dashboard.topPapers.length === 0 ? (
                <p className="text-muted mb-0">No paper data available.</p>
              ) : (
                dashboard.topPapers.map(item => (
                  <div key={item._id} className="d-flex justify-content-between border-bottom py-2">
                    <div>
                      <div className="fw-semibold">{item.title}</div>
                      <small className="text-muted">Year: {item.year || "-"}</small>
                    </div>
                    <small className="text-muted">{item.downloads || 0} downloads</small>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="row mt-3 g-3">
        <div className="col-lg-6">
          <div className="card h-100">
            <div className="card-body">
              <h5 className="mb-3">Recent Upload Activity</h5>
              {dashboard.recentUploads.length === 0 ? (
                <p className="text-muted mb-0">No papers uploaded yet.</p>
              ) : (
                dashboard.recentUploads.map(item => (
                  <div key={item._id} className="d-flex justify-content-between border-bottom py-2">
                    <div>
                      <div className="fw-semibold">{item.title}</div>
                      <small className="text-muted">Year: {item.year || "-"}</small>
                    </div>
                    <small className="text-muted">
                      {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "-"}
                    </small>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        <div className="col-lg-6">
          <div className="card h-100">
            <div className="card-body">
              <h5 className="mb-3">Action Center</h5>
              {dashboard.alerts.length === 0 ? (
                <p className="text-success mb-0">All key signals are healthy.</p>
              ) : (
                dashboard.alerts.map((item, idx) => (
                  <div key={`alert-${idx}`} className="dashboard-alert">
                    {item}
                  </div>
                ))
              )}
              <div className="mt-3 d-flex flex-wrap gap-2">
                <a className="btn btn-sm btn-outline-primary" href={`${basePath}/papers`}>Open Papers</a>
                <a className="btn btn-sm btn-outline-primary" href={`${basePath}/feedback-requests`}>Open Feedback</a>
                <a className="btn btn-sm btn-outline-primary" href={`${basePath}/notices`}>Open Notices</a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row mt-3 g-3">
        <div className="col-lg-6">
          <div className="card h-100">
            <div className="card-body">
              <h5 className="mb-3">Search Intelligence</h5>
              {dashboard.topSearchTerms.length === 0 ? (
                <p className="text-muted mb-0">No tracked search data.</p>
              ) : (
                dashboard.topSearchTerms.map((item, idx) => (
                  <div key={`search-${idx}`} className="d-flex justify-content-between border-bottom py-2">
                    <span>{item.term || "-"}</span>
                    <strong>{item.count || 0}</strong>
                  </div>
                ))
              )}
              <div className="d-flex flex-wrap gap-2 mt-3">
                <span className="dashboard-chip">Avg uploads/day: {dashboard.avgDailyUploads}</span>
                <span className="dashboard-chip">Search volume today: {dashboard.searchesToday}</span>
                <span className="dashboard-chip">Papers without year: {dashboard.papersWithoutYear}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="col-lg-6">
          <div className="card h-100">
            <div className="card-body">
              <h5 className="mb-3">University Mix + Pending Requests</h5>
              {Object.keys(stats.universityCounts || {}).length === 0 ? (
                <p className="text-muted mb-0">No university data available.</p>
              ) : (
                Object.entries(stats.universityCounts || {}).map(([key, count]) => (
                  <div key={key} className="d-flex justify-content-between border-bottom py-2">
                    <span className="text-capitalize">{key}</span>
                    <strong>{count}</strong>
                  </div>
                ))
              )}
              <hr />
              <h6 className="mb-2">Latest Pending Feedback</h6>
              {dashboard.pendingFeedbackList.length === 0 ? (
                <p className="text-muted mb-0">No pending feedback.</p>
              ) : (
                dashboard.pendingFeedbackList.map((item, idx) => (
                  <div key={`feedback-${item.id || idx}`} className="border-bottom py-2">
                    <div className="small">{item.text || "-"}</div>
                    <small className="text-muted">Source: {item.source || "unknown"}</small>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
