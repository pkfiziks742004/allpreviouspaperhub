import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { API_BASE } from "../config/api";
import { toRouteSegment } from "../utils/slugs";

const defaultPaperOpenViewer = {
  pageBgColor: "#0f172a",
  textColor: "#ffffff",
  viewerBgColor: "#ffffff",
  topBarBgColor: "#0f172a",
  topBarTextColor: "#ffffff",
  mobileHelpText: "Mobile/Tablet par in-app PDF viewer stable nahi hota. Neeche button se PDF open karein.",
  openPdfText: "Open PDF",
  downloadButtonText: "Download Paper",
  openWebsiteText: "Open Website",
  loadingText: "Loading PDF...",
  notFoundText: "Paper not found."
};

export default function PaperOpen() {
  const { id, universitySlug, courseSlug, semesterSlug, paperSlug } = useParams();
  const [paper, setPaper] = useState(null);
  const [error, setError] = useState("");
  const [isMobileOrTablet, setIsMobileOrTablet] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [paperOpenViewer, setPaperOpenViewer] = useState(defaultPaperOpenViewer);

  useEffect(() => {
    const checkDevice = () => {
      setIsMobileOrTablet(window.innerWidth <= 1024);
    };
    checkDevice();
    window.addEventListener("resize", checkDevice);
    return () => window.removeEventListener("resize", checkDevice);
  }, []);

  useEffect(() => {
    const loadPaper = async () => {
      try {
        const paperRequest = id
          ? axios.get(`${API_BASE}/api/papers/${id}`)
          : axios.get(`${API_BASE}/api/papers`);
        const [paperRes, settingsRes] = await Promise.all([
          paperRequest,
          axios.get(`${API_BASE}/api/settings`).catch(() => ({ data: {} }))
        ]);

        let resolvedPaper = null;
        if (id) {
          resolvedPaper = paperRes.data || null;
        } else {
          const all = Array.isArray(paperRes.data) ? paperRes.data : [];
          resolvedPaper =
            all.find(p => {
              const uniName = p?.courseId?.universityId?.name || p?.universityName || "";
              const courseName = p?.courseId?.name || p?.courseName || "";
              const semName = p?.semId?.name || p?.semesterName || "";
              return (
                toRouteSegment(uniName, "university") === universitySlug &&
                toRouteSegment(courseName, "course") === courseSlug &&
                toRouteSegment(semName, "semester") === semesterSlug &&
                toRouteSegment(p?.title, "paper") === paperSlug
              );
            }) || null;
        }

        setPaper(resolvedPaper);
        setPaperOpenViewer({
          ...defaultPaperOpenViewer,
          ...((settingsRes && settingsRes.data && settingsRes.data.paperOpenViewer) || {})
        });
        if (!resolvedPaper) {
          setError(
            ((settingsRes && settingsRes.data && settingsRes.data.paperOpenViewer?.notFoundText) ||
              defaultPaperOpenViewer.notFoundText)
          );
        }
      } catch (e) {
        setError(defaultPaperOpenViewer.notFoundText);
      }
    };
    loadPaper();
  }, [id, universitySlug, courseSlug, semesterSlug, paperSlug]);

  useEffect(() => {
    if (!paper?._id) return undefined;
    let active = true;
    let objectUrl = "";

    const loadPdfBlob = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/papers/open-file/${paper._id}`, {
          responseType: "arraybuffer"
        });
        if (!active) return;
        const blob = new Blob([res.data], { type: "application/pdf" });
        objectUrl = URL.createObjectURL(blob);
        setPdfBlobUrl(objectUrl);
      } catch (e) {
        setPdfBlobUrl("");
      }
    };

    loadPdfBlob();

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [paper?._id]);

  const openWebsite = () => {
    window.open("/", "_blank", "noopener,noreferrer");
  };

  const getSafeFileName = () => {
    const raw = String(paper?.title || "paper")
      .replace(/[<>:"/\\|?*\u0000-\u001F]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    return `${raw || "paper"}.pdf`;
  };

  const handleDownload = async () => {
    if (!paper?._id || downloading) return;
    try {
      setDownloading(true);
      const res = await axios.get(`${API_BASE}/api/papers/download-file/${paper._id}`, {
        responseType: "blob"
      });
      const blob = new Blob([res.data], { type: "application/pdf" });
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = getSafeFileName();
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(blobUrl);
    } catch (e) {
      window.alert("Download failed. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  if (error) {
    return <div style={{ padding: 20 }}>{error}</div>;
  }

  if (!paper) {
    return <div style={{ padding: 20 }}>{paperOpenViewer.loadingText || "Loading PDF..."}</div>;
  }

  const openUrl = `${API_BASE}/api/papers/open-file/${paper._id}`;
  const embeddedPdfUrl = pdfBlobUrl ? `${pdfBlobUrl}#toolbar=0&navpanes=0&pagemode=none` : "";

  if (isMobileOrTablet) {
    return (
      <div style={{ minHeight: "100vh", background: paperOpenViewer.pageBgColor, color: paperOpenViewer.textColor, padding: 16 }}>
        <h5 style={{ marginBottom: 12 }}>{paper.title}</h5>
        <p style={{ opacity: 0.85, marginBottom: 12 }}>
          {paperOpenViewer.mobileHelpText}
        </p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <a href={pdfBlobUrl || openUrl} target="_blank" rel="noreferrer" className="btn btn-light">
            {paperOpenViewer.openPdfText}
          </a>
          <button type="button" className="btn btn-outline-light" onClick={handleDownload}>
            {downloading ? "Downloading..." : paperOpenViewer.downloadButtonText}
          </button>
          <button type="button" className="btn btn-warning" onClick={openWebsite}>
            {paperOpenViewer.openWebsiteText}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: paperOpenViewer.pageBgColor, color: paperOpenViewer.textColor }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "10px 14px",
          gap: "10px",
          flexWrap: "wrap",
          background: paperOpenViewer.topBarBgColor,
          color: paperOpenViewer.topBarTextColor
        }}
      >
        <strong>{paper.title}</strong>
        <div style={{ display: "flex", gap: "10px" }}>
          <button type="button" className="btn btn-sm btn-light" onClick={handleDownload}>
            {downloading ? "Downloading..." : paperOpenViewer.downloadButtonText}
          </button>
          <button type="button" className="btn btn-sm btn-warning" onClick={openWebsite}>
            {paperOpenViewer.openWebsiteText}
          </button>
        </div>
      </div>

      <div style={{ position: "relative", height: "calc(100vh - 64px)", overflow: "hidden" }}>
        {!embeddedPdfUrl && (
          <div style={{ padding: 20, color: paperOpenViewer.textColor }}>{paperOpenViewer.loadingText}</div>
        )}
        <iframe
          title={paper.title}
          src={embeddedPdfUrl || "about:blank"}
          style={{
            width: "100%",
            height: "calc(100% + 56px)",
            border: 0,
            background: paperOpenViewer.viewerBgColor,
            transform: "translateY(-56px)"
          }}
        />

        <button
          type="button"
          onClick={openWebsite}
          title="Only page area click opens website"
          style={{
            position: "absolute",
            // Keep click zone around central paper area only.
            top: "0",
            bottom: "0",
            left: "50%",
            transform: "translateX(-50%)",
            width: "min(880px, 64vw)",
            background: "transparent",
            border: 0,
            cursor: "pointer"
          }}
        />
      </div>
    </div>
  );
}
