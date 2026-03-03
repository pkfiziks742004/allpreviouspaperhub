import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Layout from "../components/Layout";
import { API_BASE, resolveApiUrl } from "../config/api";
const DEFAULT_ABOUT_HTML = `
  <h2>Yeh Website Kya Karti Hai?</h2>
  <p>
    Study Portal students ko previous year papers, notes, syllabus aur exam prep resources
    ek single platform par provide karta hai.
  </p>
  <h3>How It Works</h3>
  <p>
    User pehle university/college/school card select karta hai, phir course, semester aur
    finally relevant question papers tak pohanchta hai.
  </p>
  <h3>Why This Platform</h3>
  <p>
    Platform ka focus fast access, clean structure aur practical study flow par hai.
  </p>
  <h3>Support</h3>
  <p>
    Agar aapko content me correction chahiye ho to footer contact details ke through request bhej sakte hain.
  </p>
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

const appendImageToHtml = (html, src, altText) => {
  const current = String(html || "").trim();
  const safeSrc = String(src || "").trim();
  if (!safeSrc) return current;
  const escapedAlt = String(altText || "Content image").replace(/"/g, "&quot;");
  const imageBlock = `<p><img src="${safeSrc}" alt="${escapedAlt}" loading="lazy"></p>`;
  return current ? `${current}${imageBlock}` : imageBlock;
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

export default function AboutSettings() {
  const token = localStorage.getItem("token");
  const headers = useMemo(() => ({ headers: { Authorization: token || "" } }), [token]);

  const [pageId, setPageId] = useState("");
  const [title, setTitle] = useState("About Us");
  const [bannerUrl, setBannerUrl] = useState("");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [seoKeywords, setSeoKeywords] = useState("");
  const [canonicalUrl, setCanonicalUrl] = useState("");
  const [published, setPublished] = useState(true);

  const [heroEyebrow, setHeroEyebrow] = useState("About Website");
  const [heroLead, setHeroLead] = useState(
    "Study Portal students ko previous year papers, notes, syllabus aur exam prep resources ek single platform par provide karta hai."
  );
  const [authorName, setAuthorName] = useState("");
  const [authorRole, setAuthorRole] = useState("");
  const [authorBio, setAuthorBio] = useState("");
  const [authorImage, setAuthorImage] = useState("");
  const [highlights, setHighlights] = useState([
    { value: "01", label: "University/College/School wise browsing" },
    { value: "02", label: "Course & semester level navigation" },
    { value: "03", label: "Question paper search + year filters" },
    { value: "04", label: "Admin managed updates and content control" }
  ]);
  const [infoBlocks, setInfoBlocks] = useState([
    {
      title: "How It Works",
      body: "User pehle university/college/school card select karta hai, phir course, semester aur finally relevant question papers tak pohanchta hai."
    },
    {
      title: "Why This Platform",
      body: "Internet par scattered files ki jagah curated, categorized aur accessible system diya gaya hai."
    },
    {
      title: "Who Can Use",
      body: "School boards, colleges, universities aur entrance exam aspirants sab ke liye organize kiya gaya hai."
    },
    {
      title: "Support & Corrections",
      body: "Agar content me correction chahiye ho to footer contact details ke through request bhej sakte hain."
    }
  ]);

  const [editorMode, setEditorMode] = useState("rich");
  const [contentHtml, setContentHtml] = useState(DEFAULT_ABOUT_HTML);
  const [contentText, setContentText] = useState(htmlToText(DEFAULT_ABOUT_HTML));
  const [saving, setSaving] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadingAuthorImage, setUploadingAuthorImage] = useState(false);
  const [uploadingContentImage, setUploadingContentImage] = useState(false);
  const syncFromEditorRef = useRef(false);

  const resolveUrl = url => {
    return resolveApiUrl(url);
  };

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
    const loadAbout = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/pages`, headers);
        const pages = Array.isArray(res.data) ? res.data : [];
        const about = pages.find(p => String(p.slug || "").toLowerCase() === "about");
        if (!about) return;

        setPageId(about._id || "");
        setTitle(about.title || "About Us");
        setBannerUrl(about.bannerUrl || "");
        setBgColor(about.bgColor || "#ffffff");
        setSeoTitle(about.seoTitle || "");
        setSeoDescription(about.seoDescription || "");
        setSeoKeywords(about.seoKeywords || "");
        setCanonicalUrl(about.canonicalUrl || "");
        setPublished(about.published !== false);
        setContentHtml(about.contentHtml || "");
        setContentText(htmlToText(about.contentHtml || ""));

        const extra = about.extra || {};
        const author = extra.author || {};
        setHeroEyebrow(extra.heroEyebrow || "About Website");
        setHeroLead(extra.heroLead || "");
        setAuthorName(author.name || "");
        setAuthorRole(author.role || "");
        setAuthorBio(author.bio || "");
        setAuthorImage(author.image || "");
        if (Array.isArray(extra.highlights) && extra.highlights.length > 0) {
          setHighlights(extra.highlights.slice(0, 4));
        }
        if (Array.isArray(extra.infoBlocks) && extra.infoBlocks.length > 0) {
          setInfoBlocks(extra.infoBlocks.slice(0, 4));
        }
      } catch (err) {
        // keep default values
      }
    };
    loadAbout();
  }, [headers]);

  const uploadBanner = async e => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setUploadingBanner(true);
    try {
      const fd = new FormData();
      fd.append("banner", file);
      const res = await axios.post(`${API_BASE}/api/pages/banner`, fd, headers);
      setBannerUrl(res.data.url || "");
    } catch (err) {
      alert("Banner upload failed");
    } finally {
      setUploadingBanner(false);
      e.target.value = "";
    }
  };

  const uploadAuthorImage = async e => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setUploadingAuthorImage(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await axios.post(`${API_BASE}/api/pages/content-image`, fd, headers);
      setAuthorImage(res.data.url || "");
    } catch (err) {
      alert("Author image upload failed");
    } finally {
      setUploadingAuthorImage(false);
      e.target.value = "";
    }
  };

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
        const nextHtml = appendImageToHtml(editor.getHTML(), url, file.name || "Content image");
        editor.commands.setContent(nextHtml, false);
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
      // UI already updated; save action will persist editor state.
    }
  };

  const save = async () => {
    if (!title.trim()) {
      alert("Title is required");
      return;
    }

    const payload = {
      title: title.trim(),
      slug: "about",
      bannerUrl,
      bgColor,
      seoTitle,
      seoDescription,
      seoKeywords,
      canonicalUrl,
      published,
      contentHtml: contentHtml || "",
      extra: {
        heroEyebrow,
        heroLead,
        author: {
          name: authorName,
          role: authorRole,
          bio: authorBio,
          image: authorImage
        },
        highlights: highlights.slice(0, 4),
        infoBlocks: infoBlocks.slice(0, 4)
      }
    };

    setSaving(true);
    try {
      if (pageId) {
        await axios.put(`${API_BASE}/api/pages/${pageId}`, payload, headers);
      } else {
        const res = await axios.post(`${API_BASE}/api/pages`, payload, headers);
        setPageId(res.data?._id || "");
      }
      alert("About page saved");
    } catch (err) {
      const msg = err?.response?.data || err?.message || "Save failed";
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="card p-4 shadow" style={{ maxWidth: "1100px" }}>
        <h4 className="mb-3">About Settings</h4>

        <div className="row">
          <div className="col-md-6 mb-3">
            <label className="form-label">Page Title</label>
            <input className="form-control" value={title} onChange={e => setTitle(e.target.value)} />
          </div>
          <div className="col-md-3 mb-3">
            <label className="form-label">Background Color</label>
            <input
              type="color"
              className="form-control form-control-color"
              value={bgColor}
              onChange={e => setBgColor(e.target.value)}
            />
          </div>
          <div className="col-md-3 mb-3 d-flex align-items-end">
            <div className="form-check">
              <input
                className="form-check-input"
                type="checkbox"
                id="about-published"
                checked={published}
                onChange={e => setPublished(e.target.checked)}
              />
              <label className="form-check-label" htmlFor="about-published">
                Published
              </label>
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-md-6 mb-3">
            <label className="form-label">Hero Badge Text</label>
            <input className="form-control" value={heroEyebrow} onChange={e => setHeroEyebrow(e.target.value)} />
          </div>
          <div className="col-md-6 mb-3">
            <label className="form-label">Hero Lead Text</label>
            <input className="form-control" value={heroLead} onChange={e => setHeroLead(e.target.value)} />
          </div>
        </div>

        <div className="mb-3">
          <label className="form-label">About Banner Image</label>
          <input
            type="file"
            className="form-control"
            accept="image/*"
            onChange={uploadBanner}
            disabled={uploadingBanner}
          />
          <small className="text-muted d-block mt-1">
            Recommended size: 1600x500 (16:5). Also allowed: 1920x1080 (16:9).
          </small>
          {bannerUrl && (
            <div className="mt-2 d-flex align-items-center gap-2">
              <img src={resolveUrl(bannerUrl)} alt="About banner" style={{ height: "80px", borderRadius: "8px" }} />
              <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => setBannerUrl("")}>
                Remove
              </button>
            </div>
          )}
        </div>

        <div className="border rounded p-3 mb-3">
          <div className="fw-bold mb-2">Author Section</div>
          <div className="row">
            <div className="col-md-4 mb-3">
              <label className="form-label">Author Name</label>
              <input className="form-control" value={authorName} onChange={e => setAuthorName(e.target.value)} />
            </div>
            <div className="col-md-4 mb-3">
              <label className="form-label">Author Role</label>
              <input className="form-control" value={authorRole} onChange={e => setAuthorRole(e.target.value)} />
            </div>
            <div className="col-md-4 mb-3">
              <label className="form-label">Author Image</label>
              <input
                type="file"
                className="form-control"
                accept="image/*"
                onChange={uploadAuthorImage}
                disabled={uploadingAuthorImage}
              />
            </div>
          </div>
          <div className="mb-2">
            <label className="form-label">Author Bio</label>
            <textarea className="form-control" rows="3" value={authorBio} onChange={e => setAuthorBio(e.target.value)} />
          </div>
          {authorImage && (
            <div className="mt-2 d-flex align-items-center gap-2">
              <img src={resolveUrl(authorImage)} alt="Author" style={{ height: "70px", width: "70px", borderRadius: "50%", objectFit: "cover" }} />
              <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => setAuthorImage("")}>
                Remove
              </button>
            </div>
          )}
        </div>

        <div className="border rounded p-3 mb-3">
          <div className="fw-bold mb-2">Top Cards (4)</div>
          <div className="row">
            {highlights.slice(0, 4).map((item, idx) => (
              <div className="col-md-6 mb-3" key={`highlight-${idx}`}>
                <label className="form-label">Card {idx + 1}</label>
                <div className="row g-2">
                  <div className="col-3">
                    <input
                      className="form-control"
                      value={item.value || ""}
                      onChange={e => {
                        const next = [...highlights];
                        next[idx] = { ...next[idx], value: e.target.value };
                        setHighlights(next);
                      }}
                      placeholder="01"
                    />
                  </div>
                  <div className="col-9">
                    <input
                      className="form-control"
                      value={item.label || ""}
                      onChange={e => {
                        const next = [...highlights];
                        next[idx] = { ...next[idx], label: e.target.value };
                        setHighlights(next);
                      }}
                      placeholder="Card text"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border rounded p-3 mb-3">
          <div className="fw-bold mb-2">Info Cards (4)</div>
          <div className="row">
            {infoBlocks.slice(0, 4).map((item, idx) => (
              <div className="col-md-6 mb-3" key={`info-${idx}`}>
                <label className="form-label">Section {idx + 1} Title</label>
                <input
                  className="form-control mb-2"
                  value={item.title || ""}
                  onChange={e => {
                    const next = [...infoBlocks];
                    next[idx] = { ...next[idx], title: e.target.value };
                    setInfoBlocks(next);
                  }}
                />
                <textarea
                  className="form-control"
                  rows="3"
                  value={item.body || ""}
                  onChange={e => {
                    const next = [...infoBlocks];
                    next[idx] = { ...next[idx], body: e.target.value };
                    setInfoBlocks(next);
                  }}
                  placeholder="Section content"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="border rounded p-3 mb-3">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <div className="fw-bold">Main Content (Fully Editable)</div>
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
              <div className="small text-muted mb-2">Uploaded Content Images (Remove option available)</div>
              <div className="d-flex flex-wrap gap-2">
                {contentImages.map((url, idx) => (
                  <div key={`${url}-${idx}`} className="border rounded p-2 d-flex align-items-center gap-2">
                    <img
                      src={resolveUrl(url)}
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

          {editorMode === "rich" && (
            <div>
              <EditorContent editor={editor} className="tiptap-editor" />
            </div>
          )}

          {editorMode === "simple" && (
            <textarea
              className="form-control"
              rows="10"
              value={contentText}
              onChange={e => onSimpleChange(e.target.value)}
              placeholder="Write about content..."
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
          {saving ? "Saving..." : "Save About Settings"}
        </button>
      </div>
    </Layout>
  );
}
