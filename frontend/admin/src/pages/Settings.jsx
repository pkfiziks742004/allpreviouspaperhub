import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import Layout from "../components/Layout";

const API = import.meta.env.VITE_API_BASE || import.meta.env.REACT_APP_API_BASE || "http://localhost:5000";

const ALIGN_OPTIONS = ["left", "center", "right", "justify"];
const VARIANT_OPTIONS = ["span", "p", "h1", "h2", "h3", "h4", "h5", "h6"];

const defaultTextStyle = {
  color: "#000000",
  bold: false,
  italic: false,
  align: "left",
  variant: "p"
};

export default function Settings() {
  const [alertEnabled, setAlertEnabled] = useState(false);
  const [alertText, setAlertText] = useState("");
  const [alertColor, setAlertColor] = useState("#fff3cd");
  const [alertHeight, setAlertHeight] = useState(32);
  const [alertFontSize, setAlertFontSize] = useState(14);
  const [alertMarqueeDirection, setAlertMarqueeDirection] = useState("rtl");
  const [alertMarqueeSpeed, setAlertMarqueeSpeed] = useState(18);
  const [alertMarqueeGap, setAlertMarqueeGap] = useState(2);
  const [pageBgColor, setPageBgColor] = useState("#ffffff");
  const [homeTitle, setHomeTitle] = useState("");
  const [homeSubtitle, setHomeSubtitle] = useState("");
  const [ratingEnabled, setRatingEnabled] = useState(true);
  const [ratingPopupFrequencyDays, setRatingPopupFrequencyDays] = useState(7);

  const [alertStyle, setAlertStyle] = useState({ ...defaultTextStyle, align: "center" });
  const [homeTitleStyle, setHomeTitleStyle] = useState({ ...defaultTextStyle, align: "center", variant: "h2" });
  const [homeSubtitleStyle, setHomeSubtitleStyle] = useState({ ...defaultTextStyle, color: "#6c757d", align: "center", variant: "p" });

  const [saving, setSaving] = useState(false);

  const token = localStorage.getItem("token");

  const headers = {
    headers: {
      Authorization: token
    }
  };

  const load = useCallback(() => {
    axios.get(`${API}/api/settings`).then(res => {
      setAlertEnabled(!!res.data.alertEnabled);
      setAlertText(res.data.alertText || "");
      setAlertColor(res.data.alertColor || "#fff3cd");
      setAlertHeight(Number(res.data.alertHeight || 32));
      setAlertFontSize(Number(res.data.alertFontSize || 14));
      setAlertMarqueeDirection(res.data.alertMarqueeDirection === "ltr" ? "ltr" : "rtl");
      setAlertMarqueeSpeed(Number(res.data.alertMarqueeSpeed || 18));
      setAlertMarqueeGap(Number(res.data.alertMarqueeGap || 2));
      setPageBgColor(res.data.pageBgColor || "#ffffff");
      setHomeTitle(res.data.homeTitle || "");
      setHomeSubtitle(res.data.homeSubtitle || "");
      setRatingEnabled(
        typeof res.data.ratingEnabled === "boolean"
          ? res.data.ratingEnabled
          : true
      );
      setRatingPopupFrequencyDays(
        typeof res.data.ratingPopupFrequencyDays === "number"
          ? res.data.ratingPopupFrequencyDays
          : 7
      );

      setAlertStyle(res.data.alertStyle || { ...defaultTextStyle, align: "center" });
      setHomeTitleStyle(res.data.homeTitleStyle || { ...defaultTextStyle, align: "center", variant: "h2" });
      setHomeSubtitleStyle(res.data.homeSubtitleStyle || { ...defaultTextStyle, color: "#6c757d", align: "center", variant: "p" });
    });

  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    setSaving(true);
    try {
      const normalizedRatingPopupFrequencyDays = Math.min(
        365,
        Math.max(0, Math.round(Number(ratingPopupFrequencyDays) || 0))
      );
      setRatingPopupFrequencyDays(normalizedRatingPopupFrequencyDays);
      await axios.put(
        `${API}/api/settings`,
        {
          alertEnabled,
          alertText,
          alertColor,
          alertHeight,
          alertFontSize,
          alertMarqueeDirection,
          alertMarqueeSpeed,
          alertMarqueeGap,
          pageBgColor,
          homeTitle,
          homeSubtitle,
          ratingEnabled,
          ratingPopupFrequencyDays: normalizedRatingPopupFrequencyDays,
          alertStyle,
          homeTitleStyle,
          homeSubtitleStyle
        },
        headers
      );
      alert("Settings saved");
    } catch (err) {
      const msg = err?.response?.data || err?.message || "Save failed";
      alert(msg);
    } finally {
      setSaving(false);
    }
  };


  const updateStyle = (style, setStyle, key, value) => {
    setStyle({ ...style, [key]: value });
  };

  const renderStyleControls = (label, style, setStyle) => {
    const baseId = label.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="border rounded p-3 mb-3">
        <div className="fw-bold mb-2">{label}</div>
        <div className="row">
          <div className="col-md-3 mb-2">
            <label className="form-label">Text Color</label>
            <input
              type="color"
              className="form-control form-control-color"
              value={style.color || "#000000"}
              onChange={e => updateStyle(style, setStyle, "color", e.target.value)}
            />
          </div>
          <div className="col-md-3 mb-2">
            <label className="form-label">Align</label>
            <select
              className="form-select"
              value={style.align || "left"}
              onChange={e => updateStyle(style, setStyle, "align", e.target.value)}
            >
              {ALIGN_OPTIONS.map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
          <div className="col-md-3 mb-2">
            <label className="form-label">Variant</label>
            <select
              className="form-select"
              value={style.variant || "p"}
              onChange={e => updateStyle(style, setStyle, "variant", e.target.value)}
            >
              {VARIANT_OPTIONS.map(v => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>
          <div className="col-md-3 mb-2 d-flex align-items-end">
            <div className="form-check me-3">
              <input
                className="form-check-input"
                type="checkbox"
                id={`${baseId}-bold`}
                checked={!!style.bold}
                onChange={e => updateStyle(style, setStyle, "bold", e.target.checked)}
              />
              <label className="form-check-label" htmlFor={`${baseId}-bold`}>Bold</label>
            </div>
            <div className="form-check">
              <input
                className="form-check-input"
                type="checkbox"
                id={`${baseId}-italic`}
                checked={!!style.italic}
                onChange={e => updateStyle(style, setStyle, "italic", e.target.checked)}
              />
              <label className="form-check-label" htmlFor={`${baseId}-italic`}>Italic</label>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Layout>

      <div className="card p-4 shadow" style={{ maxWidth: "900px" }}>
        <h5 className="mb-3">Home Text</h5>
        <div className="mb-3">
          <label className="form-label">Home Title</label>
          <input
            className="form-control"
            value={homeTitle}
            onChange={e => setHomeTitle(e.target.value)}
            placeholder="Home Title"
          />
        </div>

        {renderStyleControls("Home Title Style", homeTitleStyle, setHomeTitleStyle)}

        <div className="mb-3">
          <label className="form-label">Home Subtitle</label>
          <input
            className="form-control"
            value={homeSubtitle}
            onChange={e => setHomeSubtitle(e.target.value)}
            placeholder="Home Subtitle"
          />
        </div>

        {renderStyleControls("Home Subtitle Style", homeSubtitleStyle, setHomeSubtitleStyle)}

        <hr />
        <h5 className="mb-3">Rating Settings</h5>
        <div className="form-check mb-3">
          <input
            className="form-check-input"
            type="checkbox"
            id="ratingEnabled"
            checked={ratingEnabled}
            onChange={e => setRatingEnabled(e.target.checked)}
          />
          <label className="form-check-label" htmlFor="ratingEnabled">
            Enable rating popup and footer rating
          </label>
        </div>


        <div className="mb-3">
          <label className="form-label">Rating Popup Frequency (days)</label>
          <input
            type="number"
            className="form-control"
            min="0"
            max="365"
            value={ratingPopupFrequencyDays}
            onChange={e => setRatingPopupFrequencyDays(Number(e.target.value || 0))}
          />
          <div className="form-text">Set 0 to show popup on every refresh.</div>
        </div>


        <hr />
        <h5 className="mb-3">Alert</h5>
        <div className="form-check mb-2">
          <input
            className="form-check-input"
            type="checkbox"
            id="alertEnabled"
            checked={alertEnabled}
            onChange={e => setAlertEnabled(e.target.checked)}
          />
          <label className="form-check-label" htmlFor="alertEnabled">
            Enable header alert
          </label>
        </div>

        <div className="mb-3">
          <label className="form-label">Alert Text</label>
          <input
            className="form-control"
            value={alertText}
            onChange={e => setAlertText(e.target.value)}
            placeholder="Alert message below header"
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Alert Background Color</label>
          <input
            type="color"
            className="form-control form-control-color"
            value={alertColor}
            onChange={e => setAlertColor(e.target.value)}
            title="Choose alert color"
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Alert Height (px)</label>
          <input
            type="number"
            className="form-control"
            value={alertHeight}
            onChange={e => setAlertHeight(Number(e.target.value || 0))}
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Alert Text Size (px)</label>
          <input
            type="number"
            className="form-control"
            value={alertFontSize}
            onChange={e => setAlertFontSize(Number(e.target.value || 0))}
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Marquee Direction</label>
          <select
            className="form-select"
            value={alertMarqueeDirection}
            onChange={e => setAlertMarqueeDirection(e.target.value)}
          >
            <option value="rtl">Right to Left</option>
            <option value="ltr">Left to Right</option>
          </select>
        </div>

        <div className="mb-3">
          <label className="form-label">Marquee Speed (seconds)</label>
          <input
            type="number"
            min="4"
            step="1"
            className="form-control"
            value={alertMarqueeSpeed}
            onChange={e => setAlertMarqueeSpeed(Number(e.target.value || 18))}
          />
          <div className="form-text">Smaller value = faster scroll.</div>
        </div>

        <div className="mb-3">
          <label className="form-label">Marquee Gap (cm)</label>
          <input
            type="number"
            min="0.2"
            step="0.1"
            className="form-control"
            value={alertMarqueeGap}
            onChange={e => setAlertMarqueeGap(Number(e.target.value || 2))}
          />
        </div>

        {renderStyleControls("Alert Text Style", alertStyle, setAlertStyle)}


        <div className="mb-3">
          <label className="form-label">Page Background Color</label>
          <input
            type="color"
            className="form-control form-control-color"
            value={pageBgColor}
            onChange={e => setPageBgColor(e.target.value)}
            title="Choose page background"
          />
        </div>

        <hr />
        <button
          onClick={save}
          className="btn btn-primary"
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </Layout>
  );
}

