import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { API_BASE } from "../config/api";

export default function RatingPopup() {
  const [show, setShow] = useState(false);
  const [avg, setAvg] = useState(0);
  const [total, setTotal] = useState(0);
  const [myRating, setMyRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [ratingEnabled, setRatingEnabled] = useState(true);

  const shouldShow = days => {
    if (days === 0) return true; // always show on refresh
    const raw = localStorage.getItem("rated_at");
    if (!raw) return true;
    const last = Number(raw);
    if (!Number.isFinite(last)) return true;
    const ms = days * 24 * 60 * 60 * 1000;
    return Date.now() - last > ms;
  };

  const loadRating = useCallback(() => {
    axios
      .get(`${API_BASE}/api/site-rating`)
      .then(res => {
        setAvg(res.data.avg);
        setTotal(res.data.total);
      });
  }, []);

  const loadSettings = useCallback(() => {
    axios
      .get(`${API_BASE}/api/settings`)
      .then(res => {
        if (res.data && typeof res.data.ratingEnabled === "boolean") {
          setRatingEnabled(res.data.ratingEnabled);
        }
        const days = typeof res.data.ratingPopupFrequencyDays === "number"
          ? res.data.ratingPopupFrequencyDays
          : 7;
        setShow(shouldShow(days));
      });
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    if (show && ratingEnabled) loadRating();
  }, [show, ratingEnabled, loadRating]);

  const rate = async r => {
    setMyRating(r);
    await axios.post(
      `${API_BASE}/api/site-rating`,
      { rating: r }
    );

    localStorage.setItem("rated_at", String(Date.now()));

    setShow(false);
  };

  if (!show || !ratingEnabled) return null;

  const avgStars = Math.round(Number(avg) || 0);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999
      }}
    >
      <div
        className="bg-white p-4 rounded text-center shadow"
        style={{ minWidth: "320px", maxWidth: "560px", width: "90%" }}
      >
        <h4>Rate Our Website</h4>

        <div className="mt-2">
          {[1, 2, 3, 4, 5].map(s => (
            <span
              key={s}
              style={{
                fontSize: "28px",
                cursor: "pointer",
                color: s <= (hoverRating || myRating) ? "gold" : "gray"
              }}
              onClick={() => rate(s)}
              onMouseEnter={() => setHoverRating(s)}
              onMouseLeave={() => setHoverRating(0)}
            >
              {"\u2605"}
            </span>
          ))}
        </div>

        <div className="mt-3">
          <div>
            {[1, 2, 3, 4, 5].map(s => (
              <span
                key={`avg-${s}`}
                style={{
                  fontSize: "20px",
                  color: s <= avgStars ? "gold" : "lightgray"
                }}
              >
                {"\u2605"}
              </span>
            ))}
          </div>
          Rating: {avg}/5
          <div>({total} users rated)</div>
        </div>

        <button
          className="btn btn-sm btn-secondary mt-3"
          onClick={() => setShow(false)}
        >
          Later
        </button>
      </div>
    </div>
  );
}
