import { useEffect, useState } from "react";
import axios from "axios";
import Layout from "../components/Layout";

const API = process.env.REACT_APP_API_BASE || "http://localhost:5000";

export default function BannerSettings() {
  const [bannerMargin, setBannerMargin] = useState(0);
  const [bannerRadius, setBannerRadius] = useState(0);
  const [bannerImages, setBannerImages] = useState([]);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [saving, setSaving] = useState(false);

  const token = localStorage.getItem("token");
  const headers = { headers: { Authorization: token } };

  const resolveUrl = url => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    return `${API}${url}`;
  };

  useEffect(() => {
    axios.get(`${API}/api/settings`).then(res => {
      setBannerMargin(Number(res.data.bannerMargin || 0));
      setBannerRadius(Number(res.data.bannerRadius || 0));
      setBannerImages(Array.isArray(res.data.bannerImages) ? res.data.bannerImages : []);
    });
  }, []);

  const isBannerRatioValid = file =>
    new Promise(resolve => {
      const imageUrl = URL.createObjectURL(file);
      const img = new Image();

      img.onload = () => {
        const w = img.naturalWidth || img.width;
        const h = img.naturalHeight || img.height;
        URL.revokeObjectURL(imageUrl);
        if (!w || !h) return resolve(false);
        const ratio = w / h;
        const is16by5 = Math.abs(ratio - 16 / 5) <= 0.02;
        const is16by9 = Math.abs(ratio - 16 / 9) <= 0.02;
        resolve(is16by5 || is16by9);
      };

      img.onerror = () => {
        URL.revokeObjectURL(imageUrl);
        resolve(false);
      };

      img.src = imageUrl;
    });

  const uploadBanners = async e => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length === 0) return;

    const ratioResults = await Promise.all(files.map(file => isBannerRatioValid(file)));
    const invalidFiles = files.filter((_, index) => !ratioResults[index]);
    if (invalidFiles.length > 0) {
      alert(
        `Only 16:5 or 16:9 banner images are allowed. Invalid file(s): ${invalidFiles
          .map(file => file.name)
          .join(", ")}`
      );
      e.target.value = "";
      return;
    }

    setUploadingBanner(true);
    try {
      const fd = new FormData();
      files.forEach(f => fd.append("banners", f));
      const res = await axios.post(`${API}/api/settings/banners`, fd, headers);
      setBannerImages(Array.isArray(res.data.bannerImages) ? res.data.bannerImages : []);
      alert("Banners uploaded");
    } catch (err) {
      const msg = err?.response?.data || err?.message || "Banner upload failed";
      alert(msg);
    } finally {
      setUploadingBanner(false);
      e.target.value = "";
    }
  };

  const removeBanner = idx => {
    const next = bannerImages.filter((_, i) => i !== idx);
    setBannerImages(next);
  };

  const save = async () => {
    setSaving(true);
    try {
      await axios.put(
        `${API}/api/settings`,
        {
          bannerMargin,
          bannerRadius,
          bannerImages
        },
        headers
      );
      alert("Banner settings saved");
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
        <div className="mb-3">
          <label className="form-label">Banner Margin (px)</label>
          <input
            type="number"
            className="form-control"
            value={bannerMargin}
            onChange={e => setBannerMargin(Number(e.target.value || 0))}
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Banner Border Radius (px)</label>
          <input
            type="number"
            className="form-control"
            value={bannerRadius}
            onChange={e => setBannerRadius(Number(e.target.value || 0))}
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Banner Images Upload</label>
          <input
            type="file"
            className="form-control"
            accept="image/*"
            multiple
            onChange={uploadBanners}
            disabled={uploadingBanner}
          />
          <div className="form-text">
            Allowed ratios: 16:5 or 16:9 (examples: 1600x500, 1920x600, 1280x400, 1280x720, 1920x1080).
          </div>
          {bannerImages.length > 0 && (
            <div className="mt-3">
              <div className="row">
                {bannerImages.map((img, i) => (
                  <div key={img + i} className="col-md-4 mb-3">
                    <div className="card">
                      <img
                        src={resolveUrl(img)}
                        className="card-img-top"
                        alt={`Banner ${i + 1}`}
                      />
                      <div className="card-body p-2 text-center">
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => removeBanner(i)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="form-text">Remove applies after Save Settings.</div>
            </div>
          )}
        </div>

        <button className="btn btn-primary" onClick={save} disabled={saving}>
          {saving ? "Saving..." : "Save Banner Settings"}
        </button>
      </div>
    </Layout>
  );
}

