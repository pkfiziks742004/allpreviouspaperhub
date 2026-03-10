import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { API_BASE } from "../config/api";
import { applySeoByPage, applySeoByRoute } from "../utils/seo";
import { getSettings } from "../utils/siteData";
import { getArrayBuffer, getBlob, getJson } from "../utils/http";

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
  const { universitySlug, courseSlug, semesterSlug, paperSlug } = useParams();
  const [paper, setPaper] = useState(null);
  const [error, setError] = useState("");
  const [isMobileOrTablet, setIsMobileOrTablet] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState("");
  const [viewerLoading, setViewerLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [paperOpenViewer, setPaperOpenViewer] = useState(defaultPaperOpenViewer);

  useEffect(() => {
    const isMobileDevice = () => {
      const ua = navigator.userAgent || "";
      const mobileByUA =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|Tablet/i.test(ua) ||
        (navigator.maxTouchPoints > 1 && /Macintosh/i.test(ua));
      return mobileByUA;
    };

    const checkDevice = () => {
      setIsMobileOrTablet(isMobileDevice());
    };
    checkDevice();
    window.addEventListener("resize", checkDevice);
    return () => window.removeEventListener("resize", checkDevice);
  }, []);

  useEffect(() => {
    const loadPaper = async () => {
      try {
        const [paperRes, settings] = await Promise.all([
          getJson(
            `${API_BASE}/api/papers/resolve-route/${encodeURIComponent(universitySlug)}/${encodeURIComponent(courseSlug)}/${encodeURIComponent(semesterSlug)}/${encodeURIComponent(paperSlug)}`
          ),
          getSettings({ ttlMs: 45_000 }).catch(() => ({}))
        ]);
        const resolvedPaper = paperRes || null;

        setPaper(resolvedPaper);
        setPaperOpenViewer({
          ...defaultPaperOpenViewer,
          ...((settings && settings.paperOpenViewer) || {})
        });
        const seoSettings = settings || {};
        const context = {
          university: resolvedPaper?.courseId?.universityId?.name || resolvedPaper?.universityName || "",
          course: resolvedPaper?.courseId?.name || resolvedPaper?.courseName || "",
          semester: resolvedPaper?.semId?.name || resolvedPaper?.semesterName || "",
          paper: resolvedPaper?.title || "",
          universitySlug: universitySlug || "",
          courseSlug: courseSlug || "",
          semesterSlug: semesterSlug || "",
          paperSlug: paperSlug || ""
        };
        const hasRouteSeo = applySeoByRoute({
          settings: seoSettings,
          context,
          pathname: window.location.pathname
        });
        if (!hasRouteSeo) {
          applySeoByPage({
            settings: seoSettings,
            pageKey: "paperOpen",
            context,
            fallback: {
              title: resolvedPaper?.title ? `${resolvedPaper.title} | Open Paper` : "Open Paper",
              canonicalPath: `/${universitySlug || ""}/${courseSlug || ""}/${semesterSlug || ""}/${paperSlug || ""}`
            }
          });
        }
        if (!resolvedPaper) {
          setError(
            ((settings && settings.paperOpenViewer?.notFoundText) ||
              defaultPaperOpenViewer.notFoundText)
          );
        }
      } catch (e) {
        setError(defaultPaperOpenViewer.notFoundText);
      }
    };
    loadPaper();
  }, [courseSlug, paperSlug, semesterSlug, universitySlug]);

  useEffect(() => {
    if (!paper?._id || isMobileOrTablet) {
      setPdfBlobUrl("");
      setViewerLoading(false);
      return undefined;
    }

    let active = true;
    let objectUrl = "";

    const loadViewerBlob = async () => {
      try {
        setViewerLoading(true);
        const res = await getArrayBuffer(`${API_BASE}/api/papers/open-file/${paper._id}`, {
          timeoutMs: 20000
        });
        if (!active) return;
        const blob = new Blob([res], { type: "application/pdf" });
        objectUrl = URL.createObjectURL(blob);
        setPdfBlobUrl(objectUrl);
      } catch (e) {
        if (active) setPdfBlobUrl("");
      } finally {
        if (active) setViewerLoading(false);
      }
    };

    loadViewerBlob();

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [isMobileOrTablet, paper?._id]);

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
      const blob = await getBlob(`${API_BASE}/api/papers/download-file/${paper._id}`);
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
  const embeddedPdfUrl = pdfBlobUrl
    ? `${pdfBlobUrl}#toolbar=0&navpanes=0&pagemode=none`
    : "";

  if (isMobileOrTablet) {
    return (
      <div style={{ minHeight: "100vh", background: paperOpenViewer.pageBgColor, color: paperOpenViewer.textColor, padding: 16 }}>
        <h5 style={{ marginBottom: 12 }}>{paper.title}</h5>
        <p style={{ opacity: 0.85, marginBottom: 12 }}>
          {paperOpenViewer.mobileHelpText}
        </p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <a href={openUrl} target="_blank" rel="noopener noreferrer" className="btn btn-light">
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
          <div style={{ padding: 20, color: paperOpenViewer.textColor }}>
            {viewerLoading
              ? (paperOpenViewer.loadingText || "Loading PDF...")
              : (
                <>
                  PDF viewer blocked on this browser/network.{" "}
                  <a href={openUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#facc15" }}>
                    Open PDF in new tab
                  </a>
                </>
              )}
          </div>
        )}
        <iframe
          title={paper.title}
          src={embeddedPdfUrl || "about:blank"}
          style={{
            width: "100%",
            height: "100%",
            border: 0,
            background: paperOpenViewer.viewerBgColor
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
