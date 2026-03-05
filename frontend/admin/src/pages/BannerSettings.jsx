import { useEffect, useRef, useState } from "react";
import axios from "axios";
import Layout from "../components/Layout";

const API = import.meta.env.VITE_API_BASE || import.meta.env.REACT_APP_API_BASE || "http://localhost:5000";
const BADGE_SHAPES = [
  ["custom", "Custom Radius"], ["pill", "Pill"], ["square", "Square"], ["rounded-square", "Rounded Square"],
  ["soft-rounded", "Soft Rounded"], ["notch", "Notch"], ["chevron-right", "Chevron Right"], ["chevron-left", "Chevron Left"],
  ["diamond", "Diamond"], ["hexagon", "Hexagon"], ["octagon", "Octagon"], ["triangle-up", "Triangle Up"],
  ["triangle-down", "Triangle Down"], ["triangle-left", "Triangle Left"], ["triangle-right", "Triangle Right"],
  ["parallelogram-right", "Parallelogram Right"], ["parallelogram-left", "Parallelogram Left"], ["tag-right", "Tag Right"],
  ["tag-left", "Tag Left"], ["message", "Message Bubble"], ["bookmark", "Bookmark"], ["ticket", "Ticket"],
  ["ribbon", "Ribbon"], ["star-5", "Star 5"], ["star-6", "Star 6"], ["star-8", "Star 8"], ["burst-12", "Burst 12"],
  ["burst-16", "Burst 16"], ["circle", "Circle"], ["ellipse", "Ellipse"], ["leaf", "Leaf"], ["egg", "Egg"], ["cloud", "Cloud"],
  ["heart", "Heart"], ["shield", "Shield"], ["drop", "Drop"], ["arrow-right", "Arrow Right"], ["arrow-left", "Arrow Left"],
  ["arrow-up", "Arrow Up"], ["arrow-down", "Arrow Down"], ["house", "House"], ["pentagon", "Pentagon"], ["cross", "Cross"],
  ["plus", "Plus"], ["x-shape", "X Shape"], ["trapezoid", "Trapezoid"], ["frame", "Frame"], ["bevel", "Bevel"],
  ["cut-corners", "Cut Corners"], ["slant-top", "Slant Top"], ["slant-bottom", "Slant Bottom"], ["wave-top", "Wave Top"],
  ["wave-bottom", "Wave Bottom"], ["blob-1", "Blob 1"], ["blob-2", "Blob 2"]
].map(([value, label]) => ({ value, label }));
const SHAPE_3D_BASES = [
  ["pill", "Pill"], ["square", "Square"], ["diamond", "Diamond"], ["hexagon", "Hexagon"], ["octagon", "Octagon"],
  ["tag-right", "Tag Right"], ["tag-left", "Tag Left"], ["message", "Message"], ["shield", "Shield"], ["star-5", "Star"]
];
const SHAPE_3D_VARIANTS = [
  ["1", "Soft"], ["2", "Glass"], ["3", "Metal"], ["4", "Neon"], ["5", "Deep"]
];
const BADGE_3D_SHAPES = SHAPE_3D_BASES.flatMap(([base, label]) =>
  SHAPE_3D_VARIANTS.map(([variant, vLabel]) => ({
    value: `3d-${base}-${variant}`,
    label: `3D ${label} ${vLabel}`
  }))
);
const ALL_BADGE_SHAPES = [...BADGE_SHAPES, ...BADGE_3D_SHAPES];

const BADGE_SHAPE_SET = new Set(ALL_BADGE_SHAPES.map(item => item.value));
const BADGE_SHAPE_CLIP_PATH = {
  notch: "polygon(0 0, 86% 0, 100% 50%, 86% 100%, 0 100%, 8% 50%)",
  "chevron-right": "polygon(0 0, 82% 0, 100% 50%, 82% 100%, 0 100%, 10% 50%)",
  "chevron-left": "polygon(18% 0, 100% 0, 90% 50%, 100% 100%, 18% 100%, 0 50%)",
  diamond: "polygon(50% 0, 100% 50%, 50% 100%, 0 50%)",
  hexagon: "polygon(12% 0, 88% 0, 100% 50%, 88% 100%, 12% 100%, 0 50%)",
  octagon: "polygon(28% 0, 72% 0, 100% 28%, 100% 72%, 72% 100%, 28% 100%, 0 72%, 0 28%)",
  "triangle-up": "polygon(50% 0, 100% 100%, 0 100%)",
  "triangle-down": "polygon(0 0, 100% 0, 50% 100%)",
  "triangle-left": "polygon(0 50%, 100% 0, 100% 100%)",
  "triangle-right": "polygon(0 0, 100% 50%, 0 100%)",
  "parallelogram-right": "polygon(12% 0, 100% 0, 88% 100%, 0 100%)",
  "parallelogram-left": "polygon(0 0, 88% 0, 100% 100%, 12% 100%)",
  "tag-right": "polygon(0 0, 86% 0, 100% 50%, 86% 100%, 0 100%)",
  "tag-left": "polygon(14% 0, 100% 0, 100% 100%, 14% 100%, 0 50%)",
  message: "polygon(0 0, 100% 0, 100% 75%, 60% 75%, 50% 100%, 40% 75%, 0 75%)",
  bookmark: "polygon(0 0, 100% 0, 100% 100%, 50% 80%, 0 100%)",
  ticket: "polygon(0 18%, 8% 18%, 8% 0, 92% 0, 92% 18%, 100% 18%, 100% 82%, 92% 82%, 92% 100%, 8% 100%, 8% 82%, 0 82%)",
  ribbon: "polygon(0 0, 100% 0, 92% 100%, 50% 80%, 8% 100%)",
  "star-5": "polygon(50% 0, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)",
  "star-6": "polygon(50% 0, 62% 25%, 88% 25%, 75% 50%, 88% 75%, 62% 75%, 50% 100%, 38% 75%, 12% 75%, 25% 50%, 12% 25%, 38% 25%)",
  "star-8": "polygon(50% 0, 60% 22%, 82% 18%, 78% 40%, 100% 50%, 78% 60%, 82% 82%, 60% 78%, 50% 100%, 40% 78%, 18% 82%, 22% 60%, 0 50%, 22% 40%, 18% 18%, 40% 22%)",
  "burst-12": "polygon(50% 0, 60% 15%, 75% 6%, 78% 24%, 94% 25%, 85% 40%, 100% 50%, 85% 60%, 94% 75%, 78% 76%, 75% 94%, 60% 85%, 50% 100%, 40% 85%, 25% 94%, 22% 76%, 6% 75%, 15% 60%, 0 50%, 15% 40%, 6% 25%, 22% 24%, 25% 6%, 40% 15%)",
  "burst-16": "polygon(50% 0, 57% 12%, 67% 3%, 71% 16%, 84% 9%, 84% 24%, 97% 21%, 91% 34%, 100% 43%, 88% 50%, 100% 57%, 91% 66%, 97% 79%, 84% 76%, 84% 91%, 71% 84%, 67% 97%, 57% 88%, 50% 100%, 43% 88%, 33% 97%, 29% 84%, 16% 91%, 16% 76%, 3% 79%, 9% 66%, 0 57%, 12% 50%, 0 43%, 9% 34%, 3% 21%, 16% 24%, 16% 9%, 29% 16%, 33% 3%, 43% 12%)",
  circle: "circle(50% at 50% 50%)",
  ellipse: "ellipse(48% 38% at 50% 50%)",
  leaf: "polygon(50% 0, 80% 12%, 100% 40%, 86% 78%, 50% 100%, 14% 78%, 0 40%, 20% 12%)",
  egg: "ellipse(44% 48% at 50% 52%)",
  cloud: "polygon(12% 68%, 10% 48%, 24% 36%, 38% 38%, 46% 24%, 62% 20%, 76% 30%, 88% 28%, 98% 44%, 94% 66%, 82% 78%, 18% 82%)",
  heart: "polygon(50% 92%, 8% 52%, 8% 28%, 24% 10%, 40% 12%, 50% 26%, 60% 12%, 76% 10%, 92% 28%, 92% 52%)",
  shield: "polygon(50% 0, 90% 12%, 90% 55%, 50% 100%, 10% 55%, 10% 12%)",
  drop: "polygon(50% 0, 80% 24%, 92% 50%, 82% 76%, 50% 100%, 18% 76%, 8% 50%, 20% 24%)",
  "arrow-right": "polygon(0 20%, 66% 20%, 66% 0, 100% 50%, 66% 100%, 66% 80%, 0 80%)",
  "arrow-left": "polygon(34% 0, 34% 20%, 100% 20%, 100% 80%, 34% 80%, 34% 100%, 0 50%)",
  "arrow-up": "polygon(50% 0, 100% 34%, 80% 34%, 80% 100%, 20% 100%, 20% 34%, 0 34%)",
  "arrow-down": "polygon(20% 0, 80% 0, 80% 66%, 100% 66%, 50% 100%, 0 66%, 20% 66%)",
  house: "polygon(50% 0, 100% 40%, 88% 40%, 88% 100%, 12% 100%, 12% 40%, 0 40%)",
  pentagon: "polygon(50% 0, 100% 38%, 80% 100%, 20% 100%, 0 38%)",
  cross: "polygon(30% 0, 70% 0, 70% 30%, 100% 30%, 100% 70%, 70% 70%, 70% 100%, 30% 100%, 30% 70%, 0 70%, 0 30%, 30% 30%)",
  plus: "polygon(42% 0, 58% 0, 58% 42%, 100% 42%, 100% 58%, 58% 58%, 58% 100%, 42% 100%, 42% 58%, 0 58%, 0 42%, 42% 42%)",
  "x-shape": "polygon(12% 0, 50% 30%, 88% 0, 100% 12%, 70% 50%, 100% 88%, 88% 100%, 50% 70%, 12% 100%, 0 88%, 30% 50%, 0 12%)",
  trapezoid: "polygon(12% 0, 88% 0, 100% 100%, 0 100%)",
  frame: "polygon(0 0, 100% 0, 100% 100%, 0 100%, 0 84%, 84% 84%, 84% 16%, 16% 16%, 16% 84%, 0 84%)",
  bevel: "polygon(10% 0, 90% 0, 100% 12%, 100% 88%, 90% 100%, 10% 100%, 0 88%, 0 12%)",
  "cut-corners": "polygon(12% 0, 88% 0, 100% 12%, 100% 88%, 88% 100%, 12% 100%, 0 88%, 0 12%)",
  "slant-top": "polygon(0 12%, 100% 0, 100% 100%, 0 100%)",
  "slant-bottom": "polygon(0 0, 100% 0, 100% 88%, 0 100%)",
  "wave-top": "polygon(0 20%, 14% 10%, 28% 20%, 42% 10%, 57% 20%, 71% 10%, 85% 20%, 100% 10%, 100% 100%, 0 100%)",
  "wave-bottom": "polygon(0 0, 100% 0, 100% 80%, 86% 90%, 72% 80%, 58% 90%, 43% 80%, 29% 90%, 15% 80%, 0 90%)",
  "blob-1": "polygon(18% 8%, 48% 2%, 78% 10%, 96% 34%, 90% 68%, 68% 92%, 34% 98%, 8% 78%, 4% 42%)",
  "blob-2": "polygon(10% 26%, 30% 6%, 64% 2%, 90% 20%, 98% 54%, 82% 84%, 50% 98%, 20% 90%, 2% 62%)"
};

const BADGE_3D_STYLE_PRESETS = {
  "1": { backgroundImage: "linear-gradient(165deg, #ffffff55, #00000020)", filter: "saturate(1.06)" },
  "2": { backgroundImage: "linear-gradient(160deg, #ffffff88, #ffffff22 35%, #00000038)", filter: "contrast(1.05)" },
  "3": { backgroundImage: "linear-gradient(170deg, #f8fafc66, #94a3b833 46%, #0f172a55)", filter: "saturate(0.92)" },
  "4": { backgroundImage: "linear-gradient(170deg, #ffffff66, #67e8f933 45%, #0ea5e94d)", filter: "brightness(1.05)" },
  "5": { backgroundImage: "linear-gradient(175deg, #00000000, #0000004f 68%, #00000077)", filter: "contrast(1.06)" }
};

const parse3dShape = shape => {
  const match = String(shape || "").match(/^3d-([a-z0-9-]+)-([1-5])$/);
  if (!match) return null;
  return { baseShape: match[1], variant: match[2] };
};

const getBadgeShapeStyle = (shape, radius) => {
  const parsed3d = parse3dShape(shape);
  if (parsed3d) {
    const baseStyle = getBadgeShapeStyle(parsed3d.baseShape, radius);
    return {
      ...baseStyle,
      ...(BADGE_3D_STYLE_PRESETS[parsed3d.variant] || BADGE_3D_STYLE_PRESETS["1"]),
      borderColor: "#ffffff55"
    };
  }
  if (shape === "pill") return { borderRadius: 999 };
  if (shape === "square") return { borderRadius: 4 };
  if (shape === "rounded-square") return { borderRadius: 16 };
  if (shape === "soft-rounded") return { borderRadius: 24 };
  if (shape === "custom") return { borderRadius: Number(radius || 8) };
  return { borderRadius: 0, clipPath: BADGE_SHAPE_CLIP_PATH[shape] || "none" };
};

const createDefaultBannerItem = url => ({
  imageUrl: url || "",
  linkUrl: "",
  openInNewTab: false,
  fitMode: "cover",
  badgeEnabled: false,
  badgeText: "",
  badgeTop: 16,
  badgeLeft: 16,
  badgeBgColor: "#ef4444",
  badgeTextColor: "#ffffff",
  badgeFontSize: 14,
  badgeRadius: 8,
  badgePaddingX: 10,
  badgePaddingY: 6,
  badgeShape: "custom",
  badgeWidth: 0,
  badgeHeight: 0,
  badgeUseImage: false,
  badgeImageUrl: "",
  badgeImageSize: 18,
  badgeBorderWidth: 0,
  badgeBorderColor: "#ffffff",
  badgeOutlineWidth: 0,
  badgeOutlineColor: "#1e293b",
  badgeShadowX: 0,
  badgeShadowY: 6,
  badgeShadowBlur: 14,
  badgeShadowColor: "#0f172a66"
});

const normalizeBannerItem = item => ({
  ...createDefaultBannerItem(item?.imageUrl || item?.src || ""),
  ...(item || {}),
  imageUrl: String(item?.imageUrl || item?.src || "").trim(),
  linkUrl: String(item?.linkUrl || "").trim(),
  fitMode: ["cover", "contain", "fill"].includes(String(item?.fitMode || "").toLowerCase())
    ? String(item.fitMode).toLowerCase()
    : "cover",
  badgeEnabled: item?.badgeEnabled !== undefined ? !!item.badgeEnabled : !!String(item?.badgeText || "").trim(),
  badgeText: String(item?.badgeText || ""),
  badgeTop: Number.isFinite(Number(item?.badgeTop)) ? Number(item.badgeTop) : 16,
  badgeLeft: Number.isFinite(Number(item?.badgeLeft)) ? Number(item.badgeLeft) : 16,
  badgeBgColor: item?.badgeBgColor || "#ef4444",
  badgeTextColor: item?.badgeTextColor || "#ffffff",
  badgeFontSize: Number.isFinite(Number(item?.badgeFontSize)) ? Number(item.badgeFontSize) : 14,
  badgeRadius: Number.isFinite(Number(item?.badgeRadius)) ? Number(item.badgeRadius) : 8,
  badgePaddingX: Number.isFinite(Number(item?.badgePaddingX)) ? Number(item.badgePaddingX) : 10,
  badgePaddingY: Number.isFinite(Number(item?.badgePaddingY)) ? Number(item.badgePaddingY) : 6,
  badgeShape: BADGE_SHAPE_SET.has(String(item?.badgeShape || "").toLowerCase())
    ? String(item.badgeShape).toLowerCase()
    : "custom",
  badgeWidth: Number.isFinite(Number(item?.badgeWidth)) ? Number(item.badgeWidth) : 0,
  badgeHeight: Number.isFinite(Number(item?.badgeHeight)) ? Number(item.badgeHeight) : 0,
  badgeUseImage: !!item?.badgeUseImage,
  badgeImageUrl: String(item?.badgeImageUrl || ""),
  badgeImageSize: Number.isFinite(Number(item?.badgeImageSize)) ? Number(item.badgeImageSize) : 18,
  badgeBorderWidth: Number.isFinite(Number(item?.badgeBorderWidth)) ? Number(item.badgeBorderWidth) : 0,
  badgeBorderColor: item?.badgeBorderColor || "#ffffff",
  badgeOutlineWidth: Number.isFinite(Number(item?.badgeOutlineWidth)) ? Number(item.badgeOutlineWidth) : 0,
  badgeOutlineColor: item?.badgeOutlineColor || "#1e293b",
  badgeShadowX: Number.isFinite(Number(item?.badgeShadowX)) ? Number(item.badgeShadowX) : 0,
  badgeShadowY: Number.isFinite(Number(item?.badgeShadowY)) ? Number(item.badgeShadowY) : 6,
  badgeShadowBlur: Number.isFinite(Number(item?.badgeShadowBlur)) ? Number(item.badgeShadowBlur) : 14,
  badgeShadowColor: item?.badgeShadowColor || "#0f172a66"
});

export default function BannerSettings() {
  const [bannerMargin, setBannerMargin] = useState(0);
  const [bannerRadius, setBannerRadius] = useState(0);
  const [bannerItems, setBannerItems] = useState([]);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draggingBadgeIndex, setDraggingBadgeIndex] = useState(null);
  const [flashIndexes, setFlashIndexes] = useState([]);
  const bannerPreviewRefs = useRef({});
  const badgeRefs = useRef({});
  const bannerListRef = useRef(null);

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
      if (Array.isArray(res.data.bannerItems) && res.data.bannerItems.length > 0) {
        setBannerItems(res.data.bannerItems.map(normalizeBannerItem).filter(item => item.imageUrl));
      } else {
        const fallbackImages = Array.isArray(res.data.bannerImages) ? res.data.bannerImages : [];
        setBannerItems(fallbackImages.map(url => createDefaultBannerItem(url)));
      }
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
      let nextItems = [];
      if (Array.isArray(res.data.bannerItems) && res.data.bannerItems.length > 0) {
        nextItems = res.data.bannerItems.map(normalizeBannerItem).filter(item => item.imageUrl);
      } else {
        nextItems = (Array.isArray(res.data.bannerImages) ? res.data.bannerImages : []).map(url => createDefaultBannerItem(url));
      }
      setBannerItems(nextItems);
      const uploadedCount = files.length;
      const start = Math.max(0, nextItems.length - uploadedCount);
      const newIndexes = Array.from({ length: uploadedCount }, (_, idx) => start + idx);
      setFlashIndexes(newIndexes);
      window.setTimeout(() => {
        bannerListRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 80);
      window.setTimeout(() => setFlashIndexes([]), 2200);
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
    setBannerItems(prev => prev.filter((_, i) => i !== idx));
  };

  const updateBannerItem = (idx, key, value) => {
    setBannerItems(prev =>
      prev.map((item, i) => (i === idx ? { ...item, [key]: value } : item))
    );
  };

  const replaceBannerImage = async (idx, event) => {
    const file = event?.target?.files?.[0];
    if (!file) return;
    const isValid = await isBannerRatioValid(file);
    if (!isValid) {
      alert("Only 16:5 or 16:9 banner image is allowed.");
      event.target.value = "";
      return;
    }
    setUploadingBanner(true);
    try {
      const fd = new FormData();
      fd.append("banners", file);
      fd.append("replaceIndex", String(idx));
      const res = await axios.post(`${API}/api/settings/banners`, fd, headers);
      let nextItems = [];
      if (Array.isArray(res.data.bannerItems) && res.data.bannerItems.length > 0) {
        nextItems = res.data.bannerItems.map(normalizeBannerItem).filter(item => item.imageUrl);
      } else {
        nextItems = (Array.isArray(res.data.bannerImages) ? res.data.bannerImages : []).map(url => createDefaultBannerItem(url));
      }
      setBannerItems(nextItems);
      setFlashIndexes([idx]);
      window.setTimeout(() => {
        bannerPreviewRefs.current[idx]?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 80);
      window.setTimeout(() => setFlashIndexes([]), 1800);
      alert("Banner image updated");
    } catch (err) {
      const msg = err?.response?.data || err?.message || "Banner replace failed";
      alert(msg);
    } finally {
      setUploadingBanner(false);
      event.target.value = "";
    }
  };

  const uploadBadgeImage = async (idx, event) => {
    const file = event?.target?.files?.[0];
    if (!file) return;
    if (!String(file.type || "").toLowerCase().includes("png")) {
      alert("Only PNG badge image allowed.");
      event.target.value = "";
      return;
    }
    setUploadingBanner(true);
    try {
      const fd = new FormData();
      fd.append("badgeImage", file);
      const res = await axios.post(`${API}/api/settings/badge-image`, fd, headers);
      const url = String(res?.data?.url || "").trim();
      if (url) {
        setBannerItems(prev => prev.map((item, i) => (
          i === idx ? { ...item, badgeUseImage: true, badgeImageUrl: url } : item
        )));
      }
    } catch (err) {
      const msg = err?.response?.data || err?.message || "Badge image upload failed";
      alert(msg);
    } finally {
      setUploadingBanner(false);
      event.target.value = "";
    }
  };

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  const startBadgeDrag = (idx, event) => {
    if (!bannerItems[idx]?.badgeEnabled) return;
    event.preventDefault();

    const previewEl = bannerPreviewRefs.current[idx];
    const badgeEl = badgeRefs.current[idx];
    if (!previewEl || !badgeEl) return;

    const previewRect = previewEl.getBoundingClientRect();
    const badgeRect = badgeEl.getBoundingClientRect();
    const offsetX = event.clientX - badgeRect.left;
    const offsetY = event.clientY - badgeRect.top;

    setDraggingBadgeIndex(idx);

    const onMove = moveEvent => {
      const maxLeft = Math.max(0, previewRect.width - badgeRect.width);
      const maxTop = Math.max(0, previewRect.height - badgeRect.height);

      const nextLeft = clamp(moveEvent.clientX - previewRect.left - offsetX, 0, maxLeft);
      const nextTop = clamp(moveEvent.clientY - previewRect.top - offsetY, 0, maxTop);

      setBannerItems(prev =>
        prev.map((item, i) =>
          i === idx
            ? {
                ...item,
                badgeLeft: Math.round(nextLeft),
                badgeTop: Math.round(nextTop)
              }
            : item
        )
      );
    };

    const onUp = () => {
      setDraggingBadgeIndex(null);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const save = async () => {
    setSaving(true);
    try {
      await axios.put(
        `${API}/api/settings`,
        {
          bannerMargin,
          bannerRadius,
          bannerItems
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

      <div className="card p-4 shadow banner-settings-card" style={{ maxWidth: "980px" }}>
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
          {bannerItems.length > 0 && (
            <div className="mt-3" ref={bannerListRef}>
              <div className="row">
                {bannerItems.map((item, i) => (
                  <div key={`${item.imageUrl}-${i}`} className="col-xl-6 col-lg-12 mb-3">
                    <div className={`card banner-item-card ${flashIndexes.includes(i) ? "banner-item-card-flash" : ""}`}>
                      <div
                        ref={el => {
                          if (el) bannerPreviewRefs.current[i] = el;
                        }}
                        style={{
                          position: "relative",
                          width: "100%",
                          height: "220px",
                          overflow: "hidden",
                          borderTopLeftRadius: "inherit",
                          borderTopRightRadius: "inherit",
                          background: "#f6f7fb"
                        }}
                      >
                        <img
                          src={resolveUrl(item.imageUrl)}
                          className="card-img-top"
                          alt={`Banner ${i + 1}`}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: item.fitMode || "cover",
                            objectPosition: "center"
                          }}
                        />
                        {item.badgeEnabled && item.badgeText && (
                          <span
                            ref={el => {
                              if (el) badgeRefs.current[i] = el;
                            }}
                            onPointerDown={e => startBadgeDrag(i, e)}
                            style={{
                              position: "absolute",
                              top: Number(item.badgeTop || 0),
                              left: Number(item.badgeLeft || 0),
                              background: item.badgeBgColor || "#ef4444",
                              color: item.badgeTextColor || "#ffffff",
                              fontSize: Number(item.badgeFontSize || 14),
                              ...getBadgeShapeStyle(item.badgeShape || "custom", item.badgeRadius),
                              padding: `${Number(item.badgePaddingY || 6)}px ${Number(item.badgePaddingX || 10)}px`,
                              lineHeight: 1.2,
                              fontWeight: 600,
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              width:
                                Number(item.badgeWidth || 0) > 0
                                  ? `${Number(item.badgeWidth)}px`
                                  : item.badgeShape && !["custom", "pill", "square", "rounded-square", "soft-rounded"].includes(item.badgeShape)
                                    ? "88px"
                                    : "auto",
                              minHeight:
                                Number(item.badgeHeight || 0) > 0
                                  ? `${Number(item.badgeHeight)}px`
                                  : item.badgeShape && !["custom", "pill", "square", "rounded-square", "soft-rounded"].includes(item.badgeShape)
                                    ? "44px"
                                    : "auto",
                              cursor: draggingBadgeIndex === i ? "grabbing" : "grab",
                              userSelect: "none",
                              touchAction: "none",
                              border: `${Number(item.badgeBorderWidth || 0)}px solid ${item.badgeBorderColor || "#ffffff"}`,
                              outline: `${Number(item.badgeOutlineWidth || 0)}px solid ${item.badgeOutlineColor || "#1e293b"}`,
                              boxShadow: `${Number(item.badgeShadowX || 0)}px ${Number(item.badgeShadowY || 0)}px ${Number(item.badgeShadowBlur || 0)}px ${item.badgeShadowColor || "#0f172a66"}`
                            }}
                            title="Drag to move badge"
                          >
                            {item.badgeUseImage && item.badgeImageUrl ? (
                              <img
                                src={resolveUrl(item.badgeImageUrl)}
                                alt="badge"
                                style={{
                                  width: `${Math.max(12, Number(item.badgeImageSize || 18))}px`,
                                  height: `${Math.max(12, Number(item.badgeImageSize || 18))}px`,
                                  objectFit: "contain",
                                  marginRight: item.badgeText ? "6px" : "0"
                                }}
                              />
                            ) : null}
                            {item.badgeText}
                          </span>
                        )}
                      </div>
                      <div className="card-body p-3 text-center">
                        <div className="small fw-semibold text-start mb-2">Banner #{i + 1}</div>
                        <div className="mb-2">
                          <label className="form-label small">Link URL</label>
                          <input
                            className="form-control form-control-sm"
                            value={item.linkUrl || ""}
                            onChange={e => updateBannerItem(i, "linkUrl", e.target.value)}
                            placeholder="https://example.com or /about"
                          />
                        </div>
                        <div className="form-check form-switch mb-2 text-start">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id={`openInNewTab-${i}`}
                            checked={!!item.openInNewTab}
                            onChange={e => updateBannerItem(i, "openInNewTab", e.target.checked)}
                          />
                          <label className="form-check-label small" htmlFor={`openInNewTab-${i}`}>
                            Open link in new tab
                          </label>
                        </div>
                        <div className="mb-2 text-start">
                          <label className="form-label small">Image Fit</label>
                          <select
                            className="form-select form-select-sm"
                            value={item.fitMode || "cover"}
                            onChange={e => updateBannerItem(i, "fitMode", e.target.value)}
                          >
                            <option value="cover">Cover</option>
                            <option value="contain">Contain</option>
                            <option value="fill">Fill</option>
                          </select>
                        </div>
                        <div className="border rounded p-2 mb-2 text-start">
                          <div className="small fw-bold mb-2">Badge Overlay</div>
                          <div className="form-check form-switch mb-2">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id={`badgeEnabled-${i}`}
                              checked={!!item.badgeEnabled}
                              onChange={e => updateBannerItem(i, "badgeEnabled", e.target.checked)}
                            />
                            <label className="form-check-label small" htmlFor={`badgeEnabled-${i}`}>
                              Enable badge
                            </label>
                          </div>
                          <input
                            className="form-control form-control-sm mb-2"
                            value={item.badgeText || ""}
                            onChange={e => updateBannerItem(i, "badgeText", e.target.value)}
                            placeholder="Badge text"
                          />
                          <div className="form-check form-switch mb-2">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id={`badgeUseImage-${i}`}
                              checked={!!item.badgeUseImage}
                              onChange={e => updateBannerItem(i, "badgeUseImage", e.target.checked)}
                            />
                            <label className="form-check-label small" htmlFor={`badgeUseImage-${i}`}>
                              Use custom PNG image
                            </label>
                          </div>
                          <div className="row g-2 mb-2">
                            <div className="col-8">
                              <input
                                className="form-control form-control-sm"
                                value={item.badgeImageUrl || ""}
                                onChange={e => updateBannerItem(i, "badgeImageUrl", e.target.value)}
                                placeholder="Badge PNG URL"
                              />
                            </div>
                            <div className="col-4">
                              <label className="btn btn-sm btn-outline-secondary w-100 mb-0">
                                PNG Upload
                                <input
                                  type="file"
                                  accept="image/png"
                                  hidden
                                  onChange={e => uploadBadgeImage(i, e)}
                                  disabled={uploadingBanner}
                                />
                              </label>
                            </div>
                          </div>
                          <div className="form-text mb-2">Tip: Preview badge ko drag karke exact position set karein.</div>
                          <div className="row g-2">
                            <div className="col-6">
                              <label className="form-label small">Top(px)</label>
                              <input
                                type="number"
                                className="form-control form-control-sm"
                                value={Number(item.badgeTop || 0)}
                                onChange={e => updateBannerItem(i, "badgeTop", Number(e.target.value || 0))}
                              />
                            </div>
                            <div className="col-6">
                              <label className="form-label small">Left(px)</label>
                              <input
                                type="number"
                                className="form-control form-control-sm"
                                value={Number(item.badgeLeft || 0)}
                                onChange={e => updateBannerItem(i, "badgeLeft", Number(e.target.value || 0))}
                              />
                            </div>
                            <div className="col-6">
                              <label className="form-label small">Text Color</label>
                              <input
                                type="color"
                                className="form-control form-control-color form-control-sm"
                                value={item.badgeTextColor || "#ffffff"}
                                onChange={e => updateBannerItem(i, "badgeTextColor", e.target.value)}
                              />
                            </div>
                            <div className="col-6">
                              <label className="form-label small">Badge Color</label>
                              <input
                                type="color"
                                className="form-control form-control-color form-control-sm"
                                value={item.badgeBgColor || "#ef4444"}
                                onChange={e => updateBannerItem(i, "badgeBgColor", e.target.value)}
                              />
                            </div>
                            <div className="col-4">
                              <label className="form-label small">Font</label>
                              <input
                                type="number"
                                className="form-control form-control-sm"
                                value={Number(item.badgeFontSize || 14)}
                                onChange={e => updateBannerItem(i, "badgeFontSize", Number(e.target.value || 0))}
                              />
                            </div>
                            <div className="col-4">
                              <label className="form-label small">Radius</label>
                              <input
                                type="number"
                                className="form-control form-control-sm"
                                value={Number(item.badgeRadius || 8)}
                                onChange={e => updateBannerItem(i, "badgeRadius", Number(e.target.value || 0))}
                              />
                            </div>
                            <div className="col-4">
                              <label className="form-label small">Pad X</label>
                              <input
                                type="number"
                                className="form-control form-control-sm"
                                value={Number(item.badgePaddingX || 10)}
                                onChange={e => updateBannerItem(i, "badgePaddingX", Number(e.target.value || 0))}
                              />
                            </div>
                            <div className="col-4">
                              <label className="form-label small">Pad Y</label>
                              <input
                                type="number"
                                className="form-control form-control-sm"
                                value={Number(item.badgePaddingY || 6)}
                                onChange={e => updateBannerItem(i, "badgePaddingY", Number(e.target.value || 0))}
                              />
                            </div>
                            <div className="col-6">
                              <label className="form-label small">Shape</label>
                              <select
                                className="form-select form-select-sm"
                                value={item.badgeShape || "custom"}
                                onChange={e => updateBannerItem(i, "badgeShape", e.target.value)}
                              >
                                {ALL_BADGE_SHAPES.map(shape => (
                                  <option key={shape.value} value={shape.value}>{shape.label}</option>
                                ))}
                              </select>
                            </div>
                            <div className="col-3">
                              <label className="form-label small">Width</label>
                              <input
                                type="number"
                                className="form-control form-control-sm"
                                value={Number(item.badgeWidth || 0)}
                                onChange={e => updateBannerItem(i, "badgeWidth", Number(e.target.value || 0))}
                                placeholder="Auto"
                              />
                            </div>
                            <div className="col-3">
                              <label className="form-label small">Height</label>
                              <input
                                type="number"
                                className="form-control form-control-sm"
                                value={Number(item.badgeHeight || 0)}
                                onChange={e => updateBannerItem(i, "badgeHeight", Number(e.target.value || 0))}
                                placeholder="Auto"
                              />
                            </div>
                            <div className="col-3">
                              <label className="form-label small">Img Size</label>
                              <input
                                type="number"
                                className="form-control form-control-sm"
                                value={Number(item.badgeImageSize || 18)}
                                onChange={e => updateBannerItem(i, "badgeImageSize", Number(e.target.value || 0))}
                              />
                            </div>
                            <div className="col-3">
                              <label className="form-label small">Border</label>
                              <input
                                type="number"
                                className="form-control form-control-sm"
                                value={Number(item.badgeBorderWidth || 0)}
                                onChange={e => updateBannerItem(i, "badgeBorderWidth", Number(e.target.value || 0))}
                              />
                            </div>
                            <div className="col-3">
                              <label className="form-label small">Border Color</label>
                              <input
                                type="color"
                                className="form-control form-control-color form-control-sm"
                                value={item.badgeBorderColor || "#ffffff"}
                                onChange={e => updateBannerItem(i, "badgeBorderColor", e.target.value)}
                              />
                            </div>
                            <div className="col-3">
                              <label className="form-label small">Outline</label>
                              <input
                                type="number"
                                className="form-control form-control-sm"
                                value={Number(item.badgeOutlineWidth || 0)}
                                onChange={e => updateBannerItem(i, "badgeOutlineWidth", Number(e.target.value || 0))}
                              />
                            </div>
                            <div className="col-3">
                              <label className="form-label small">Outline Color</label>
                              <input
                                type="color"
                                className="form-control form-control-color form-control-sm"
                                value={item.badgeOutlineColor || "#1e293b"}
                                onChange={e => updateBannerItem(i, "badgeOutlineColor", e.target.value)}
                              />
                            </div>
                            <div className="col-4">
                              <label className="form-label small">Shadow X</label>
                              <input
                                type="number"
                                className="form-control form-control-sm"
                                value={Number(item.badgeShadowX || 0)}
                                onChange={e => updateBannerItem(i, "badgeShadowX", Number(e.target.value || 0))}
                              />
                            </div>
                            <div className="col-4">
                              <label className="form-label small">Shadow Y</label>
                              <input
                                type="number"
                                className="form-control form-control-sm"
                                value={Number(item.badgeShadowY || 6)}
                                onChange={e => updateBannerItem(i, "badgeShadowY", Number(e.target.value || 0))}
                              />
                            </div>
                            <div className="col-4">
                              <label className="form-label small">Shadow Blur</label>
                              <input
                                type="number"
                                className="form-control form-control-sm"
                                value={Number(item.badgeShadowBlur || 14)}
                                onChange={e => updateBannerItem(i, "badgeShadowBlur", Number(e.target.value || 0))}
                              />
                            </div>
                            <div className="col-6">
                              <label className="form-label small">Shadow Color</label>
                              <input
                                type="color"
                                className="form-control form-control-color form-control-sm"
                                value={
                                  /^#[0-9A-Fa-f]{6}$/.test(String(item.badgeShadowColor || ""))
                                    ? item.badgeShadowColor
                                    : "#334155"
                                }
                                onChange={e => updateBannerItem(i, "badgeShadowColor", e.target.value)}
                              />
                            </div>
                          </div>
                        </div>
                        <div className="d-flex gap-2 justify-content-end">
                          <label className="btn btn-sm btn-outline-primary mb-0">
                            Update
                            <input
                              type="file"
                              accept="image/*"
                              hidden
                              onChange={e => replaceBannerImage(i, e)}
                              disabled={uploadingBanner}
                            />
                          </label>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => removeBanner(i)}
                          >
                            Remove
                          </button>
                        </div>
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

