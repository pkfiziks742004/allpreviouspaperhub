import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { API_BASE } from "../config/api";

export default function PaperOpen() {
  const { id } = useParams();
  const [paper, setPaper] = useState(null);
  const [error, setError] = useState("");
  const [isMobileOrTablet, setIsMobileOrTablet] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState("");
  const [downloading, setDownloading] = useState(false);

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
        const res = await axios.get(`${API_BASE}/api/papers/${id}`);
        setPaper(res.data || null);
      } catch (e) {
        setError("Paper not found.");
      }
    };
    loadPaper();
  }, [id]);

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
    return <div style={{ padding: 20 }}>Loading PDF...</div>;
  }

  const openUrl = `${API_BASE}/api/papers/open-file/${paper._id}`;
  const embeddedPdfUrl = pdfBlobUrl ? `${pdfBlobUrl}#toolbar=0&navpanes=0&pagemode=none` : "";

  if (isMobileOrTablet) {
    return (
      <div style={{ minHeight: "100vh", background: "#0f172a", color: "#fff", padding: 16 }}>
        <h5 style={{ marginBottom: 12 }}>{paper.title}</h5>
        <p style={{ opacity: 0.85, marginBottom: 12 }}>
          Mobile/Tablet par in-app PDF viewer stable nahi hota. Neeche button se PDF open karein.
        </p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <a href={pdfBlobUrl || openUrl} target="_blank" rel="noreferrer" className="btn btn-light">
            Open PDF
          </a>
          <button type="button" className="btn btn-outline-light" onClick={handleDownload}>
            {downloading ? "Downloading..." : "Download Paper"}
          </button>
          <button type="button" className="btn btn-warning" onClick={openWebsite}>
            Open Website
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0f172a", color: "#fff" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "10px 14px",
          gap: "10px",
          flexWrap: "wrap"
        }}
      >
        <strong>{paper.title}</strong>
        <div style={{ display: "flex", gap: "10px" }}>
          <button type="button" className="btn btn-sm btn-light" onClick={handleDownload}>
            {downloading ? "Downloading..." : "Download Paper"}
          </button>
          <button type="button" className="btn btn-sm btn-warning" onClick={openWebsite}>
            Open Website
          </button>
        </div>
      </div>

      <div style={{ position: "relative", height: "calc(100vh - 64px)", overflow: "hidden" }}>
        {!embeddedPdfUrl && (
          <div style={{ padding: 20, color: "#fff" }}>Loading PDF...</div>
        )}
        <iframe
          title={paper.title}
          src={embeddedPdfUrl || "about:blank"}
          style={{
            width: "100%",
            height: "calc(100% + 56px)",
            border: 0,
            background: "#fff",
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
