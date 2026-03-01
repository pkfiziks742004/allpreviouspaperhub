import { useEffect, useState } from "react";
import axios from "axios";
import Layout from "../components/Layout";

const API = process.env.REACT_APP_API_BASE || "http://localhost:5000";

export default function AdsSettings() {
  const [enabled, setEnabled] = useState(false);
  const [headScript, setHeadScript] = useState("");
  const [bodyScript, setBodyScript] = useState("");
  const [adsTxt, setAdsTxt] = useState("");
  const [saving, setSaving] = useState(false);

  const token = localStorage.getItem("token");

  const headers = {
    headers: {
      Authorization: token
    }
  };

  const load = () => {
    axios.get(`${API}/api/ads-settings`).then(res => {
      setEnabled(!!res.data.enabled);
      setHeadScript(res.data.headScript || "");
      setBodyScript(res.data.bodyScript || "");
      setAdsTxt(res.data.adsTxt || "");
    });
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await axios.put(
        `${API}/api/ads-settings`,
        { enabled, headScript, bodyScript, adsTxt },
        headers
      );
      alert("Ads settings saved");
    } catch (err) {
      const msg = err?.response?.data || err?.message || "Save failed";
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>

      <div className="card p-4 shadow" style={{ maxWidth: "900px" }}>
        <div className="form-check mb-3">
          <input
            className="form-check-input"
            type="checkbox"
            id="adsEnabled"
            checked={enabled}
            onChange={e => setEnabled(e.target.checked)}
          />
          <label className="form-check-label" htmlFor="adsEnabled">
            Enable Google Ads
          </label>
        </div>

        <div className="mb-3">
          <label className="form-label">Head Script</label>
          <textarea
            className="form-control"
            rows={5}
            value={headScript}
            onChange={e => setHeadScript(e.target.value)}
            placeholder="Paste Google Ads script for <head> here"
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Body Script</label>
          <textarea
            className="form-control"
            rows={5}
            value={bodyScript}
            onChange={e => setBodyScript(e.target.value)}
            placeholder="Paste Google Ads script for <body> here"
          />
        </div>

        <div className="mb-3">
          <label className="form-label">ads.txt</label>
          <textarea
            className="form-control"
            rows={5}
            value={adsTxt}
            onChange={e => setAdsTxt(e.target.value)}
            placeholder="Paste ads.txt content"
          />
        </div>

        <button onClick={save} className="btn btn-primary" disabled={saving}>
          {saving ? "Saving..." : "Save Ads Settings"}
        </button>
      </div>

      <div className="card p-4 shadow mt-3" style={{ maxWidth: "900px" }}>
        <details>
          <summary className="fw-bold mb-3" style={{ cursor: "pointer" }}>
            How To Use Google Ads Settings (Click to Expand)
          </summary>
          <div className="mt-3">
        <ol className="mb-3">
          <li>Google AdSense account me login karo.</li>
          <li>`Ads` ya `By site` section me jaakar apna site code copy karo.</li>
          <li>`Head Script` me AdSense ka main script paste karo (jo `&lt;script async ...&gt;` hota hai).</li>
          <li>`Body Script` me optional code paste karo (agar Google ne body placement diya ho).</li>
          <li>`ads.txt` field me publisher line paste karo (example: `google.com, pub-xxxxxxxxxxxx, DIRECT, f08c47fec0942fa0`).</li>
          <li>`Enable Google Ads` ON karo aur `Save Ads Settings` click karo.</li>
        </ol>

        <div className="alert alert-warning mb-3">
          <strong>Important:</strong> Script me sirf trusted Google code hi paste karo. Unknown third-party script paste mat karo.
        </div>

        <h6 className="mb-2">Verification Checklist</h6>
        <ul className="mb-0">
          <li>Home page source me head script visible ho.</li>
          <li>`/ads.txt` URL open karke ads.txt content check ho.</li>
          <li>AdSense dashboard me site status `Ready` ya `Getting ready` aaye.</li>
        </ul>

        <hr />
        <h6 className="mb-2">Quick Setup Order (Recommended)</h6>
        <ol className="mb-3">
          <li>Pehle `Head Script` save karo.</li>
          <li>Phir `ads.txt` paste karke save karo.</li>
          <li>Uske baad `Enable Google Ads` ON karo.</li>
          <li>Last me 10-30 minutes wait karke AdSense status recheck karo.</li>
        </ol>

        <h6 className="mb-2">Common Mistakes</h6>
        <ul className="mb-0">
          <li>Same script ko multiple baar paste kar dena.</li>
          <li>Wrong publisher id (`pub-...`) use karna.</li>
          <li>ads.txt line me extra spaces ya broken commas.</li>
          <li>Enable ON karke save na karna.</li>
        </ul>
          </div>
        </details>
      </div>
    </Layout>
  );
}

