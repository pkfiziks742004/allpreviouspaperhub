import { useEffect, useState } from "react";
import axios from "axios";
import Layout from "../components/Layout";

const API = import.meta.env.VITE_API_BASE || import.meta.env.REACT_APP_API_BASE || "http://localhost:5000";
const createSeoRoute = () => ({
  path: "",
  title: "",
  description: "",
  keywords: "",
  ogImage: "",
  canonicalPath: ""
});

export default function TrafficSettings() {
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [seoKeywords, setSeoKeywords] = useState("");
  const [ogImage, setOgImage] = useState("");
  const [analyticsHeadScript, setAnalyticsHeadScript] = useState("");
  const [analyticsBodyScript, setAnalyticsBodyScript] = useState("");
  const [maintenanceEnabled, setMaintenanceEnabled] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState("");
  const [canonicalUrl, setCanonicalUrl] = useState("");
  const [sitemapBaseUrl, setSitemapBaseUrl] = useState("");
  const [sitemapExtraPaths, setSitemapExtraPaths] = useState("");
  const [userPageTitle, setUserPageTitle] = useState("");
  const [adminPageTitle, setAdminPageTitle] = useState("");
  const [faviconUrl, setFaviconUrl] = useState("");
  const [seoRoutes, setSeoRoutes] = useState([]);
  const [saving, setSaving] = useState(false);
  const [uploadingOg, setUploadingOg] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const [uploadingSeoRouteIndex, setUploadingSeoRouteIndex] = useState(null);
  const [editingSeoRouteIndex, setEditingSeoRouteIndex] = useState(null);

  const token = localStorage.getItem("token");
  const headers = { headers: { Authorization: token } };

  useEffect(() => {
    axios.get(`${API}/api/settings`).then(res => {
      setSeoTitle(res.data.seoTitle || "");
      setSeoDescription(res.data.seoDescription || "");
      setSeoKeywords(res.data.seoKeywords || "");
      setOgImage(res.data.ogImage || "");
      setAnalyticsHeadScript(res.data.analyticsHeadScript || "");
      setAnalyticsBodyScript(res.data.analyticsBodyScript || "");
      setMaintenanceEnabled(!!res.data.maintenanceEnabled);
      setMaintenanceMessage(res.data.maintenanceMessage || "");
      setCanonicalUrl(res.data.canonicalUrl || "");
      setSitemapBaseUrl(res.data.sitemapBaseUrl || "");
      setSitemapExtraPaths(
        Array.isArray(res.data.sitemapExtraPaths)
          ? res.data.sitemapExtraPaths.join("\n")
          : ""
      );
      setUserPageTitle(res.data.userPageTitle || "Study Portal");
      setAdminPageTitle(res.data.adminPageTitle || "Admin Panel");
      setFaviconUrl(res.data.faviconUrl || "");
      const routes = Array.isArray(res.data.seoRoutes) ? res.data.seoRoutes : [];
      setSeoRoutes(routes);
      setEditingSeoRouteIndex(routes.length > 0 ? 0 : null);
    });
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await axios.put(
        `${API}/api/settings`,
        {
          seoTitle,
          seoDescription,
          seoKeywords,
          ogImage,
          seoRoutes,
          faviconUrl,
          analyticsHeadScript,
          analyticsBodyScript,
          maintenanceEnabled,
          maintenanceMessage,
          canonicalUrl,
          sitemapBaseUrl,
          sitemapExtraPaths: sitemapExtraPaths
            .split("\n")
            .map(s => s.trim())
            .filter(Boolean),
          userPageTitle,
          adminPageTitle
        },
        headers
      );
      try {
        localStorage.setItem("admin_page_title_cache", String(adminPageTitle || "").trim());
      } catch (e) {
        // ignore storage errors
      }
      alert("Traffic/SEO settings saved");
    } catch (err) {
      const msg = err?.response?.data || err?.message || "Save failed";
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  const uploadOg = async e => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setUploadingOg(true);
    try {
      const fd = new FormData();
      fd.append("ogImage", file);
      const res = await axios.post(`${API}/api/settings/og-image`, fd, headers);
      setOgImage(res.data.ogImage || "");
      alert("OG image uploaded");
    } catch (err) {
      alert("OG image upload failed");
    } finally {
      setUploadingOg(false);
      e.target.value = "";
    }
  };

  const uploadFavicon = async e => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setUploadingFavicon(true);
    try {
      const fd = new FormData();
      fd.append("favicon", file);
      const res = await axios.post(`${API}/api/settings/favicon`, fd, headers);
      setFaviconUrl(res.data.faviconUrl || "");
      alert("Favicon uploaded");
    } catch (err) {
      alert("Favicon upload failed");
    } finally {
      setUploadingFavicon(false);
      e.target.value = "";
    }
  };

  const removeOgImage = async () => {
    if (!window.confirm("Remove OG image?")) return;
    try {
      await axios.put(`${API}/api/settings`, { ogImage: "" }, headers);
      setOgImage("");
      alert("OG image removed");
    } catch (err) {
      alert("Failed to remove OG image");
    }
  };

  const removeFavicon = async () => {
    if (!window.confirm("Remove favicon?")) return;
    try {
      await axios.put(`${API}/api/settings`, { faviconUrl: "" }, headers);
      setFaviconUrl("");
      alert("Favicon removed");
    } catch (err) {
      alert("Failed to remove favicon");
    }
  };

  const resolveUrl = url => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    return `${API}${url}`;
  };

  const addSeoRoute = () => {
    setSeoRoutes(prev => {
      const next = [...prev, createSeoRoute()];
      setEditingSeoRouteIndex(next.length - 1);
      return next;
    });
  };

  const updateSeoRoute = (index, field, value) => {
    setSeoRoutes(prev => prev.map((item, idx) => (idx === index ? { ...item, [field]: value } : item)));
  };

  const removeSeoRoute = index => {
    setSeoRoutes(prev => {
      const next = prev.filter((_, idx) => idx !== index);
      setEditingSeoRouteIndex(current => {
        if (next.length === 0) return null;
        if (current === null) return 0;
        if (current === index) return current >= next.length ? next.length - 1 : current;
        if (current > index) return current - 1;
        return current;
      });
      return next;
    });
  };

  const getSeoRouteLabel = rule => {
    const raw = String(rule?.path || "").trim();
    if (!raw) return "(Path not set)";
    return raw;
  };

  const uploadSeoRouteImage = async (index, e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setUploadingSeoRouteIndex(index);
    try {
      const fd = new FormData();
      fd.append("seoImage", file);
      const res = await axios.post(`${API}/api/settings/seo-image`, fd, headers);
      const url = res?.data?.url || "";
      if (url) {
        updateSeoRoute(index, "ogImage", url);
      }
      alert("SEO route image uploaded");
    } catch (err) {
      alert("SEO route image upload failed");
    } finally {
      setUploadingSeoRouteIndex(null);
      e.target.value = "";
    }
  };

  return (
    <Layout>

      <div className="card p-4 shadow" style={{ maxWidth: "900px" }}>
        <h5 className="mb-3">SEO</h5>
        <div className="mb-3">
          <label className="form-label">SEO Title</label>
          <input
            className="form-control"
            value={seoTitle}
            onChange={e => setSeoTitle(e.target.value)}
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Favicon Upload</label>
          <input
            type="file"
            className="form-control"
            accept="image/*"
            onChange={uploadFavicon}
            disabled={uploadingFavicon}
          />
          {faviconUrl && (
            <div className="mt-2 d-flex align-items-center gap-2">
              <img src={resolveUrl(faviconUrl)} alt="Favicon" style={{ height: "32px", width: "32px" }} />
              <span className="text-muted">Browser tab will update after refresh.</span>
              <button type="button" className="btn btn-sm btn-outline-danger" onClick={removeFavicon}>
                Remove
              </button>
            </div>
          )}
        </div>
        <div className="mb-3">
          <label className="form-label">User Page Title</label>
          <input
            className="form-control"
            value={userPageTitle}
            onChange={e => setUserPageTitle(e.target.value)}
            placeholder="User website title"
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Admin Page Title</label>
          <input
            className="form-control"
            value={adminPageTitle}
            onChange={e => setAdminPageTitle(e.target.value)}
            placeholder="Admin panel title"
          />
        </div>
        <div className="mb-3">
          <label className="form-label">SEO Description</label>
          <textarea
            className="form-control"
            rows="3"
            value={seoDescription}
            onChange={e => setSeoDescription(e.target.value)}
          />
        </div>
        <div className="mb-3">
          <label className="form-label">SEO Keywords</label>
          <input
            className="form-control"
            value={seoKeywords}
            onChange={e => setSeoKeywords(e.target.value)}
            placeholder="keyword1, keyword2, keyword3"
          />
        </div>

        <div className="border rounded p-3 mb-3">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h6 className="mb-0">URL Based SEO Rules</h6>
            <button type="button" className="btn btn-sm btn-outline-primary" onClick={addSeoRoute}>
              Add URL Rule
            </button>
          </div>
          {seoRoutes.length === 0 ? (
            <div className="text-muted small">
              Add URL rule, for example: <code>/up-board-12th-class/hindi/hindi-2025</code> or full URL.
            </div>
          ) : (
            <>
              <div className="border rounded mb-3">
                <div className="table-responsive">
                  <table className="table table-sm align-middle mb-0">
                    <thead>
                      <tr>
                        <th style={{ width: "70px" }}>#</th>
                        <th>Saved Link / Path</th>
                        <th style={{ width: "200px" }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {seoRoutes.map((rule, idx) => (
                        <tr key={`seo-route-row-${idx}`}>
                          <td>{idx + 1}</td>
                          <td style={{ wordBreak: "break-all" }}>
                            {getSeoRouteLabel(rule)}
                          </td>
                          <td>
                            <div className="d-flex gap-2">
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => setEditingSeoRouteIndex(idx)}
                              >
                                Update
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => removeSeoRoute(idx)}
                              >
                                Remove
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {editingSeoRouteIndex !== null && seoRoutes[editingSeoRouteIndex] && (
                <div className="border rounded p-3 mb-1">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <strong>Editing Rule #{editingSeoRouteIndex + 1}</strong>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => setEditingSeoRouteIndex(null)}
                    >
                      Close
                    </button>
                  </div>
                  <div className="mb-2">
                    <label className="form-label">URL / Path</label>
                    <input
                      className="form-control"
                      value={seoRoutes[editingSeoRouteIndex].path || ""}
                      onChange={e => updateSeoRoute(editingSeoRouteIndex, "path", e.target.value)}
                      placeholder="/up-board-12th-class/hindi/hindi-2025 or https://www.allpreviouspaperhub.in/up-board-12th-class/hindi/hindi-2025"
                    />
                  </div>
                  <div className="mb-2">
                    <label className="form-label">Title</label>
                    <input
                      className="form-control"
                      value={seoRoutes[editingSeoRouteIndex].title || ""}
                      onChange={e => updateSeoRoute(editingSeoRouteIndex, "title", e.target.value)}
                    />
                  </div>
                  <div className="mb-2">
                    <label className="form-label">Description</label>
                    <textarea
                      className="form-control"
                      rows="2"
                      value={seoRoutes[editingSeoRouteIndex].description || ""}
                      onChange={e => updateSeoRoute(editingSeoRouteIndex, "description", e.target.value)}
                    />
                  </div>
                  <div className="mb-2">
                    <label className="form-label">Keywords</label>
                    <input
                      className="form-control"
                      value={seoRoutes[editingSeoRouteIndex].keywords || ""}
                      onChange={e => updateSeoRoute(editingSeoRouteIndex, "keywords", e.target.value)}
                    />
                  </div>
                  <div className="mb-2">
                    <label className="form-label">OG Image URL (optional)</label>
                    <div className="row g-2">
                      <div className="col-8">
                        <input
                          className="form-control"
                          value={seoRoutes[editingSeoRouteIndex].ogImage || ""}
                          onChange={e => updateSeoRoute(editingSeoRouteIndex, "ogImage", e.target.value)}
                          placeholder="https://..."
                        />
                      </div>
                      <div className="col-4">
                        <label className="btn btn-outline-secondary w-100 mb-0">
                          {uploadingSeoRouteIndex === editingSeoRouteIndex ? "Uploading..." : "Upload Image"}
                          <input
                            type="file"
                            accept="image/*"
                            hidden
                            disabled={uploadingSeoRouteIndex === editingSeoRouteIndex}
                            onChange={e => uploadSeoRouteImage(editingSeoRouteIndex, e)}
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="form-label">Canonical Path/URL (optional)</label>
                    <input
                      className="form-control"
                      value={seoRoutes[editingSeoRouteIndex].canonicalPath || ""}
                      onChange={e => updateSeoRoute(editingSeoRouteIndex, "canonicalPath", e.target.value)}
                      placeholder="/up-board-12th-class/hindi/hindi-2025"
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="mb-3">
          <label className="form-label">OG Image Upload</label>
          <input
            type="file"
            className="form-control"
            accept="image/*"
            onChange={uploadOg}
            disabled={uploadingOg}
          />
          {ogImage && (
            <div className="mt-2 d-flex align-items-center gap-2">
              <img src={resolveUrl(ogImage)} alt="OG" style={{ height: "80px" }} />
              <button type="button" className="btn btn-sm btn-outline-danger" onClick={removeOgImage}>
                Remove
              </button>
            </div>
          )}
        </div>

        <hr />
        <h5 className="mb-3">Analytics</h5>
        <div className="mb-3">
          <label className="form-label">Head Script</label>
          <textarea
            className="form-control"
            rows="5"
            value={analyticsHeadScript}
            onChange={e => setAnalyticsHeadScript(e.target.value)}
            placeholder="<script>...</script>"
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Body Script</label>
          <textarea
            className="form-control"
            rows="5"
            value={analyticsBodyScript}
            onChange={e => setAnalyticsBodyScript(e.target.value)}
            placeholder="<script>...</script>"
          />
        </div>

        <hr />
        <h5 className="mb-3">Maintenance Mode</h5>
        <div className="form-check mb-2">
          <input
            className="form-check-input"
            type="checkbox"
            id="maintenanceEnabled"
            checked={maintenanceEnabled}
            onChange={e => setMaintenanceEnabled(e.target.checked)}
          />
          <label className="form-check-label" htmlFor="maintenanceEnabled">
            Enable maintenance mode
          </label>
        </div>
        <div className="mb-3">
          <label className="form-label">Maintenance Message</label>
          <textarea
            className="form-control"
            rows="3"
            value={maintenanceMessage}
            onChange={e => setMaintenanceMessage(e.target.value)}
          />
        </div>

        <hr />
        <h5 className="mb-3">Sitemap & Canonical</h5>
        <div className="mb-3">
          <label className="form-label">Canonical URL</label>
          <input
            className="form-control"
            placeholder="https://example.com"
            value={canonicalUrl}
            onChange={e => setCanonicalUrl(e.target.value)}
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Sitemap Base URL</label>
          <input
            className="form-control"
            placeholder="https://example.com"
            value={sitemapBaseUrl}
            onChange={e => setSitemapBaseUrl(e.target.value)}
          />
          <div className="form-text">Sitemap will be available at /sitemap.xml</div>
        </div>
        <div className="mb-3">
          <label className="form-label">Sitemap Extra Paths (one per line)</label>
          <textarea
            className="form-control"
            rows="4"
            value={sitemapExtraPaths}
            onChange={e => setSitemapExtraPaths(e.target.value)}
            placeholder="/course/123"
          />
        </div>

        <div className="alert alert-info mb-3">
          <h6 className="mb-2">How to Use SEO & Traffic Settings</h6>
          <ol className="mb-0 ps-3">
            <li className="mb-1">SEO Title, Description, Keywords fill karo for better Google ranking.</li>
            <li className="mb-1">Favicon upload karo, then browser refresh karke check karo.</li>
            <li className="mb-1">OG Image upload karo so shared links me proper preview aaye.</li>
            <li className="mb-1">Google Analytics / GTM scripts Head Script aur Body Script me paste karo.</li>
            <li className="mb-1">Maintenance Mode sirf site maintenance ke time ON karo.</li>
            <li className="mb-1">Canonical URL me main domain do (example: https://yourdomain.com).</li>
            <li className="mb-1">Sitemap Base URL domain set karo aur extra custom paths add karo.</li>
            <li>Sab changes ke baad Save Settings button press karo.</li>
          </ol>
        </div>

        <button className="btn btn-primary" onClick={save} disabled={saving}>
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </Layout>
  );
}

