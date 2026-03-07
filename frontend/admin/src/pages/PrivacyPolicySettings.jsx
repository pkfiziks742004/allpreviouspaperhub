import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";

import Layout from "../components/Layout";
import { API_BASE, resolveApiUrl } from "../config/api";

const DEFAULT_PRIVACY_HTML = `
  <h2>Privacy Policy</h2>
  <p>
    All Previous Paper Hub par aapki privacy important hai. Hum basic usage data sirf service improve karne ke liye use karte hain.
  </p>
  <h3>1. Information We Collect</h3>
  <ul>
    <li>Basic browser/device details for analytics and security.</li>
    <li>Search/query usage patterns for improving navigation and results.</li>
    <li>Feedback forms me diya gaya data (agar aap submit karein).</li>
  </ul>
  <h3>2. How We Use Information</h3>
  <ul>
    <li>Website performance aur user experience improve karne ke liye.</li>
    <li>Security monitoring aur misuse detection ke liye.</li>
    <li>Content quality aur relevant updates ke liye.</li>
  </ul>
`.trim();

const htmlToText = html => {
  if (!html) return "";
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\n\s*\n/g, "\n")
    .trim();
};

const escapeHtml = text => {
  return String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
};

const textToHtml = text => {
  const lines = String(text || "")
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(Boolean);
  return lines.map(l => `<p>${escapeHtml(l)}</p>`).join("");
};

const normalizeAssetUrl = value => String(value || "").trim().split("?")[0];

const extractContentImageUrls = html => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(String(html || ""), "text/html");
  const urls = [];
  doc.querySelectorAll("img[src]").forEach(img => {
    const src = String(img.getAttribute("src") || "").trim();
    if (!src) return;
    if (!urls.includes(src)) urls.push(src);
  });
  return urls;
};

const removeImageFromHtml = (html, srcToRemove) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(String(html || ""), "text/html");
  const target = normalizeAssetUrl(srcToRemove);
  doc.querySelectorAll("img[src]").forEach(img => {
    const src = normalizeAssetUrl(img.getAttribute("src"));
    if (src !== target) return;
    const parent = img.parentElement;
    img.remove();
    if (
      parent &&
      parent.tagName === "P" &&
      !parent.querySelector("img") &&
      !String(parent.textContent || "").trim()
    ) {
      parent.remove();
    }
  });
  return doc.body.innerHTML;
};

export default function PrivacyPolicySettings() {
  const token = localStorage.getItem("token");
  const headers = useMemo(() => ({ headers: { Authorization: token || "" } }), [token]);

  const [pageId, setPageId] = useState("");
  const [title, setTitle] = useState("Privacy Policy");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [seoKeywords, setSeoKeywords] = useState("");
  const [canonicalUrl, setCanonicalUrl] = useState("");
  const [published, setPublished] = useState(true);

  const [editorMode, setEditorMode] = useState("rich");
  const [contentHtml, setContentHtml] = useState(DEFAULT_PRIVACY_HTML);
  const [contentText, setContentText] = useState(htmlToText(DEFAULT_PRIVACY_HTML));
  const [saving, setSaving] = useState(false);
  const [uploadingContentImage, setUploadingContentImage] = useState(false);
  const syncFromEditorRef = useRef(false);

  const editor = useEditor({
    extensions: [StarterKit, Image],
    content: contentHtml || "",
    onUpdate: ({ editor: ed }) => {
      syncFromEditorRef.current = true;
      setContentHtml(ed.getHTML());
    }
  });

  const contentImages = useMemo(() => extractContentImageUrls(contentHtml), [contentHtml]);

  useEffect(() => {
    if (!editor || editorMode !== "rich") return;
    if (syncFromEditorRef.current) {
      syncFromEditorRef.current = false;
      return;
    }
    if (editor.getHTML() !== (contentHtml || "")) {
      editor.commands.setContent(contentHtml || "", false);
    }
  }, [editorMode, editor, contentHtml]);

  useEffect(() => {
    const loadPage = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/pages`, headers);
        const pages = Array.isArray(res.data) ? res.data : [];
        const privacyPage = pages.find(p => String(p.slug || "").toLowerCase() === "privacy-policy");
        if (!privacyPage) return;

        setPageId(privacyPage._id || "");
        setTitle(privacyPage.title || "Privacy Policy");
        setSeoTitle(privacyPage.seoTitle || "");
        setSeoDescription(privacyPage.seoDescription || "");
        setSeoKeywords(privacyPage.seoKeywords || "");
        setCanonicalUrl(privacyPage.canonicalUrl || "");
        setPublished(privacyPage.published !== false);
        setContentHtml(privacyPage.contentHtml || DEFAULT_PRIVACY_HTML);
        setContentText(htmlToText(privacyPage.contentHtml || DEFAULT_PRIVACY_HTML));
      } catch (err) {
        // keep defaults
      }
    };
    loadPage();
  }, [headers]);

  const uploadContentImage = async e => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setUploadingContentImage(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await axios.post(`${API_BASE}/api/pages/content-image`, fd, headers);
      const url = resolveApiUrl(res.data.url || "");
      if (!url) return;
      if (editorMode === "rich" && editor) {
        editor.chain().focus().setImage({ src: url, alt: file.name || "Content image" }).run();
        const nextHtml = editor.getHTML();
        setContentHtml(nextHtml);
        setContentText(htmlToText(nextHtml));
      } else {
        const next = `${contentText}\n${url}`.trim();
        setContentText(next);
        setContentHtml(textToHtml(next));
      }
    } catch (err) {
      alert("Content image upload failed");
    } finally {
      setUploadingContentImage(false);
      e.target.value = "";
    }
  };

  const onSimpleChange = value => {
    setContentText(value);
    setContentHtml(textToHtml(value));
  };

  const removeContentImage = async url => {
    const nextHtml = removeImageFromHtml(contentHtml, url);
    setContentHtml(nextHtml);
    setContentText(htmlToText(nextHtml));
    if (editor) {
      editor.commands.setContent(nextHtml, false);
    }
    try {
      await axios.delete(`${API_BASE}/api/pages/media/content-image`, {
        ...headers,
        data: { url }
      });
    } catch (err) {
      // UI already updated
    }
  };

  const save = async () => {
    if (!title.trim()) {
      alert("Title is required");
      return;
    }

    const payload = {
      title: title.trim(),
      slug: "privacy-policy",
      seoTitle,
      seoDescription,
      seoKeywords,
      canonicalUrl,
      published,
      contentHtml: contentHtml || ""
    };

    setSaving(true);
    try {
      if (pageId) {
        await axios.put(`${API_BASE}/api/pages/${pageId}`, payload, headers);
      } else {
        const res = await axios.post(`${API_BASE}/api/pages`, payload, headers);
        setPageId(res.data?._id || "");
      }
      alert("Privacy Policy saved");
    } catch (err) {
      const msg = err?.response?.data || err?.message || "Save failed";
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="card p-4 shadow" style={{ maxWidth: "1000px" }}>
        <h4 className="mb-3">Privacy Policy Settings</h4>
        <p className="text-muted mb-3">
          Is page me sirf content/SEO editable hai. User-side Privacy Policy ka design fixed rahega.
        </p>

        <div className="row">
          <div className="col-md-8 mb-3">
            <label className="form-label">Page Title</label>
            <input className="form-control" value={title} onChange={e => setTitle(e.target.value)} />
          </div>
          <div className="col-md-4 mb-3 d-flex align-items-end">
            <div className="form-check">
              <input
                className="form-check-input"
                type="checkbox"
                id="privacy-published"
                checked={published}
                onChange={e => setPublished(e.target.checked)}
              />
              <label className="form-check-label" htmlFor="privacy-published">
                Published
              </label>
            </div>
          </div>
        </div>

        <div className="border rounded p-3 mb-3">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <div className="fw-bold">Privacy Policy Content</div>
            <div className="d-flex gap-2">
              <div className="btn-group">
                <button
                  type="button"
                  className={`btn btn-sm ${editorMode === "rich" ? "btn-primary" : "btn-outline-primary"}`}
                  onClick={() => setEditorMode("rich")}
                >
                  Rich
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${editorMode === "simple" ? "btn-primary" : "btn-outline-primary"}`}
                  onClick={() => setEditorMode("simple")}
                >
                  Simple
                </button>
              </div>
              <label className="btn btn-sm btn-outline-secondary mb-0">
                {uploadingContentImage ? "Uploading..." : "Upload Content Image"}
                <input type="file" accept="image/*" hidden onChange={uploadContentImage} disabled={uploadingContentImage} />
              </label>
            </div>
          </div>

          {contentImages.length > 0 && (
            <div className="mb-3">
              <div className="small text-muted mb-2">Uploaded Content Images</div>
              <div className="d-flex flex-wrap gap-2">
                {contentImages.map((url, idx) => (
                  <div key={`${url}-${idx}`} className="border rounded p-2 d-flex align-items-center gap-2">
                    <img
                      src={resolveApiUrl(url)}
                      alt={`Content ${idx + 1}`}
                      style={{ width: "48px", height: "48px", objectFit: "cover", borderRadius: "6px" }}
                    />
                    <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => removeContentImage(url)}>
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {editorMode === "rich" && <EditorContent editor={editor} className="tiptap-editor" />}

          {editorMode === "simple" && (
            <textarea
              className="form-control"
              rows="12"
              value={contentText}
              onChange={e => onSimpleChange(e.target.value)}
              placeholder="Write privacy policy content..."
            />
          )}
        </div>

        <div className="border rounded p-3 mb-3">
          <div className="fw-bold mb-2">SEO</div>
          <div className="row">
            <div className="col-md-6 mb-2">
              <label className="form-label">SEO Title</label>
              <input className="form-control" value={seoTitle} onChange={e => setSeoTitle(e.target.value)} />
            </div>
            <div className="col-md-6 mb-2">
              <label className="form-label">Canonical URL</label>
              <input className="form-control" value={canonicalUrl} onChange={e => setCanonicalUrl(e.target.value)} />
            </div>
          </div>
          <div className="mb-2">
            <label className="form-label">SEO Description</label>
            <textarea className="form-control" rows="3" value={seoDescription} onChange={e => setSeoDescription(e.target.value)} />
          </div>
          <div>
            <label className="form-label">SEO Keywords</label>
            <input className="form-control" value={seoKeywords} onChange={e => setSeoKeywords(e.target.value)} />
          </div>
        </div>

        <button className="btn btn-primary" onClick={save} disabled={saving}>
          {saving ? "Saving..." : "Save Privacy Policy"}
        </button>
      </div>
    </Layout>
  );
}
