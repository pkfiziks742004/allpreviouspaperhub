import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import Layout from "../components/Layout";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";

const API = import.meta.env.VITE_API_BASE || import.meta.env.REACT_APP_API_BASE || "http://localhost:5000";

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

const makeSlug = value => {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

const wordCountFromHtml = html => {
  const text = htmlToText(html || "");
  if (!text) return 0;
  return text.split(/\s+/).filter(Boolean).length;
};

export default function Pages() {
  const [pages, setPages] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [bannerUrl, setBannerUrl] = useState("");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [seoKeywords, setSeoKeywords] = useState("");
  const [canonicalUrl, setCanonicalUrl] = useState("");
  const [published, setPublished] = useState(true);
  const [editorMode, setEditorMode] = useState("rich");
  const [contentHtml, setContentHtml] = useState("");
  const [contentText, setContentText] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [saving, setSaving] = useState(false);
  const [rowBusyId, setRowBusyId] = useState("");
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadingContentImage, setUploadingContentImage] = useState(false);

  const token = localStorage.getItem("token");
  const headers = useMemo(
    () => ({ headers: { Authorization: token } }),
    [token]
  );

  const resolveUrl = url => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    return `${API}${url}`;
  };

  const loadPages = useCallback(() => {
    axios
      .get(`${API}/api/pages`, headers)
      .then(res => setPages(res.data || []));
  }, [headers]);

  useEffect(() => {
    loadPages();
  }, [loadPages]);

  const editor = useEditor({
    extensions: [StarterKit, Image],
    content: contentHtml || "",
    onUpdate: ({ editor: ed }) => {
      setContentHtml(ed.getHTML());
    }
  });

  useEffect(() => {
    if (editorMode === "rich" && editor) {
      editor.commands.setContent(contentHtml || "", false);
    }
  }, [editorMode, editor, contentHtml]);

  useEffect(() => {
    if (!slugTouched) {
      setSlug(makeSlug(title));
    }
  }, [title, slugTouched]);

  const filteredPages = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (pages || []).filter(p => {
      const matchesSearch = !q ||
        String(p.title || "").toLowerCase().includes(q) ||
        String(p.slug || "").toLowerCase().includes(q);
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "published" && p.published) ||
        (statusFilter === "draft" && !p.published);
      return matchesSearch && matchesStatus;
    });
  }, [pages, search, statusFilter]);

  const resetForm = () => {
    setEditingId(null);
    setTitle("");
    setSlug("");
    setSlugTouched(false);
    setBannerUrl("");
    setBgColor("#ffffff");
    setSeoTitle("");
    setSeoDescription("");
    setSeoKeywords("");
    setCanonicalUrl("");
    setPublished(true);
    setContentHtml("");
    setContentText("");
  };

  const startEdit = page => {
    setEditingId(page._id);
    setTitle(page.title || "");
    setSlug(page.slug || "");
    setSlugTouched(true);
    setBannerUrl(page.bannerUrl || "");
    setBgColor(page.bgColor || "#ffffff");
    setSeoTitle(page.seoTitle || "");
    setSeoDescription(page.seoDescription || "");
    setSeoKeywords(page.seoKeywords || "");
    setCanonicalUrl(page.canonicalUrl || "");
    setPublished(!!page.published);
    setContentHtml(page.contentHtml || "");
    setContentText(htmlToText(page.contentHtml || ""));
  };

  const insertImageAtCursor = url => {
    if (!editor) return;
    editor.chain().focus().setImage({ src: url }).run();
  };

  const onSimpleChange = value => {
    setContentText(value);
    setContentHtml(textToHtml(value));
  };

  const save = async () => {
    if (!title.trim()) {
      alert("Title is required");
      return;
    }
    if (canonicalUrl && !/^https?:\/\//i.test(canonicalUrl)) {
      alert("Canonical URL must start with http:// or https://");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        slug: makeSlug(slug || title),
        bannerUrl,
        bgColor,
        seoTitle,
        seoDescription,
        seoKeywords,
        canonicalUrl,
        published,
        contentHtml: contentHtml || ""
      };
      if (editingId) {
        await axios.put(`${API}/api/pages/${editingId}`, payload, headers);
      } else {
        await axios.post(`${API}/api/pages`, payload, headers);
      }
      resetForm();
      loadPages();
      alert("Page saved");
    } catch (err) {
      const msg = err?.response?.data || err?.message || "Save failed";
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  const togglePublished = async page => {
    setRowBusyId(page._id);
    try {
      await axios.put(
        `${API}/api/pages/${page._id}`,
        { published: !page.published },
        headers
      );
      loadPages();
    } catch (err) {
      alert("Status update failed");
    } finally {
      setRowBusyId("");
    }
  };

  const remove = async id => {
    if (!window.confirm("Delete this page?")) return;
    try {
      await axios.delete(`${API}/api/pages/${id}`, headers);
      loadPages();
    } catch (err) {
      alert("Delete failed");
    }
  };

  const duplicate = async page => {
    try {
      const payload = {
        title: `${page.title || "Page"} Copy`,
        slug: makeSlug(`${page.slug || page.title || "page"}-copy`),
        bannerUrl: page.bannerUrl || "",
        bgColor: page.bgColor || "#ffffff",
        seoTitle: page.seoTitle || "",
        seoDescription: page.seoDescription || "",
        seoKeywords: page.seoKeywords || "",
        canonicalUrl: page.canonicalUrl || "",
        published: false,
        contentHtml: page.contentHtml || ""
      };
      await axios.post(`${API}/api/pages`, payload, headers);
      loadPages();
      alert("Page duplicated as draft");
    } catch (err) {
      const msg = err?.response?.data || err?.message || "Duplicate failed";
      alert(msg);
    }
  };

  const uploadBanner = async e => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    setUploadingBanner(true);
    try {
      const fd = new FormData();
      fd.append("banner", file);
      const res = await axios.post(`${API}/api/pages/banner`, fd, headers);
      setBannerUrl(res.data.url || "");
      alert("Banner uploaded");
    } catch (err) {
      alert("Banner upload failed");
    } finally {
      setUploadingBanner(false);
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
      const res = await axios.post(`${API}/api/pages/content-image`, fd, headers);
      const url = res.data.url ? `${API}${res.data.url}` : "";
      if (url && editorMode === "rich") {
        insertImageAtCursor(url);
      } else if (url) {
        const next = `${contentText}\n${url}`.trim();
        onSimpleChange(next);
      }
    } catch (err) {
      alert("Image upload failed");
    } finally {
      setUploadingContentImage(false);
      e.target.value = "";
    }
  };

  return (
    <Layout>

      <div className="card p-4 shadow mb-4" style={{ maxWidth: "1000px" }}>
        <div className="d-flex justify-content-between align-items-center mb-2">
          <div className="fw-bold">{editingId ? "Edit Page" : "New Page"}</div>
          {editingId && (
            <button className="btn btn-sm btn-outline-secondary" onClick={resetForm}>
              New Page
            </button>
          )}
        </div>

        <div className="row">
          <div className="col-md-6 mb-3">
            <label className="form-label">Title</label>
            <input
              className="form-control"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Page title"
            />
          </div>
          <div className="col-md-6 mb-3">
            <label className="form-label">Slug (URL)</label>
            <div className="input-group">
              <input
                className="form-control"
                value={slug}
                onChange={e => {
                  setSlugTouched(true);
                  setSlug(makeSlug(e.target.value));
                }}
                placeholder="about-us"
              />
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => {
                  setSlug(makeSlug(title));
                  setSlugTouched(false);
                }}
              >
                Auto
              </button>
            </div>
            <div className="form-text">Final URL: `/page/{makeSlug(slug || title) || "page"}`</div>
            <div className="form-text">Tip: About page ko admin se control karne ke liye slug `about` rakhein.</div>
          </div>
        </div>

        <div className="row">
          <div className="col-md-6 mb-3">
            <label className="form-label">Banner Image</label>
            <input
              type="file"
              className="form-control"
              accept="image/*"
              onChange={uploadBanner}
              disabled={uploadingBanner}
            />
            {bannerUrl && (
              <div className="mt-2">
                <img src={resolveUrl(bannerUrl)} alt="Banner" style={{ height: "80px" }} />
                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger ms-2"
                  onClick={() => setBannerUrl("")}
                >
                  Remove
                </button>
              </div>
            )}
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
                id="page-published"
                checked={published}
                onChange={e => setPublished(e.target.checked)}
              />
              <label className="form-check-label" htmlFor="page-published">
                Published
              </label>
            </div>
          </div>
        </div>

        <div className="border rounded p-3 mb-3">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <div className="fw-bold">Content Editor</div>
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
          </div>

          {editorMode === "rich" && (
            <>
              <div className="tiptap-toolbar" role="toolbar">
                <div className="btn-group me-2">
                  <button
                    className={`btn btn-sm btn-outline-secondary ${editor?.isActive("bold") ? "active" : ""}`}
                    type="button"
                    onClick={() => editor?.chain().focus().toggleBold().run()}
                  >
                    Bold
                  </button>
                  <button
                    className={`btn btn-sm btn-outline-secondary ${editor?.isActive("italic") ? "active" : ""}`}
                    type="button"
                    onClick={() => editor?.chain().focus().toggleItalic().run()}
                  >
                    Italic
                  </button>
                </div>
                <div className="btn-group me-2">
                  <button
                    className={`btn btn-sm btn-outline-secondary ${editor?.isActive("heading", { level: 2 }) ? "active" : ""}`}
                    type="button"
                    onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                  >
                    H2
                  </button>
                  <button
                    className={`btn btn-sm btn-outline-secondary ${editor?.isActive("heading", { level: 3 }) ? "active" : ""}`}
                    type="button"
                    onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
                  >
                    H3
                  </button>
                  <button
                    className={`btn btn-sm btn-outline-secondary ${editor?.isActive("paragraph") ? "active" : ""}`}
                    type="button"
                    onClick={() => editor?.chain().focus().setParagraph().run()}
                  >
                    P
                  </button>
                </div>
                <div className="btn-group me-2">
                  <button
                    className={`btn btn-sm btn-outline-secondary ${editor?.isActive("bulletList") ? "active" : ""}`}
                    type="button"
                    onClick={() => editor?.chain().focus().toggleBulletList().run()}
                  >
                    UL
                  </button>
                  <button
                    className={`btn btn-sm btn-outline-secondary ${editor?.isActive("orderedList") ? "active" : ""}`}
                    type="button"
                    onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                  >
                    OL
                  </button>
                </div>
                <div className="btn-group me-2">
                  <button
                    className="btn btn-sm btn-outline-secondary"
                    type="button"
                    onClick={() => {
                      const url = window.prompt("Enter link URL");
                      if (!url) return;
                      if (editor) {
                        editor.chain().focus().insertContent(`<a href="${url}" target="_blank" rel="noreferrer">${url}</a>`).run();
                      }
                    }}
                  >
                    Link
                  </button>
                  <label className="btn btn-sm btn-outline-secondary mb-0">
                    {uploadingContentImage ? "Uploading..." : "Upload Image"}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={uploadContentImage}
                      disabled={uploadingContentImage}
                      hidden
                    />
                  </label>
                </div>
                <div className="btn-group">
                  <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => editor?.chain().focus().clearNodes().unsetAllMarks().run()}>
                    Clear
                  </button>
                </div>
              </div>
              <EditorContent editor={editor} className="tiptap-editor" />
            </>
          )}

          {editorMode === "simple" && (
            <textarea
              className="form-control"
              rows="8"
              value={contentText}
              onChange={e => onSimpleChange(e.target.value)}
              placeholder="Write content here..."
            />
          )}
        </div>

        <div className="border rounded p-3 mb-3">
          <div className="fw-bold mb-2">SEO</div>
          <div className="mb-2">
            <label className="form-label">SEO Title</label>
            <input
              className="form-control"
              value={seoTitle}
              onChange={e => setSeoTitle(e.target.value)}
            />
          </div>
          <div>
            <label className="form-label">SEO Description</label>
            <textarea
              className="form-control"
              rows="3"
              value={seoDescription}
              onChange={e => setSeoDescription(e.target.value)}
            />
          </div>
          <div className="mt-2">
            <label className="form-label">SEO Keywords (comma separated)</label>
            <input
              className="form-control"
              value={seoKeywords}
              onChange={e => setSeoKeywords(e.target.value)}
              placeholder="exam, question paper, notes"
            />
          </div>
          <div className="mt-2">
            <label className="form-label">Canonical URL</label>
            <input
              className="form-control"
              value={canonicalUrl}
              onChange={e => setCanonicalUrl(e.target.value)}
              placeholder="https://example.com/page/about-us"
            />
          </div>
        </div>

        <div className="border rounded p-3 mb-3">
          <div className="fw-bold mb-2">Quick Preview</div>
          <div className="small text-muted mb-2">
            Words: {wordCountFromHtml(contentHtml)} | Estimated read: {Math.max(1, Math.ceil(wordCountFromHtml(contentHtml) / 200))} min
          </div>
          <div className="border rounded p-2 bg-white">
            <div className="fw-semibold">{title || "Untitled Page"}</div>
            <div className="text-muted small">/page/{makeSlug(slug || title) || "page"}</div>
            {seoDescription && <div className="small mt-2">{seoDescription}</div>}
          </div>
        </div>

        <button className="btn btn-primary" onClick={save} disabled={saving}>
          {saving ? "Saving..." : "Save Page"}
        </button>
      </div>

      <div className="card p-4 shadow" style={{ maxWidth: "1000px" }}>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div className="fw-bold">All Pages</div>
          <div className="d-flex gap-2">
            <input
              className="form-control"
              style={{ minWidth: "220px" }}
              placeholder="Search by title or slug"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <select
              className="form-select"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="all">All</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
              }}
            >
              Reset
            </button>
          </div>
        </div>
        {filteredPages.length === 0 && <div className="text-muted">No pages found.</div>}
        {filteredPages.map(page => (
          <div key={page._id} className="border rounded p-3 mb-2">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <div className="fw-bold">{page.title}</div>
                <div className="text-muted">/page/{page.slug}</div>
                <div className="small text-muted">
                  Updated: {new Date(page.updatedAt || page.createdAt).toLocaleString()}
                </div>
                {!page.published && <span className="badge bg-secondary mt-1">Draft</span>}
              </div>
              <div className="d-flex gap-2">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => duplicate(page)}
                >
                  Duplicate
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${page.published ? "btn-outline-warning" : "btn-outline-success"}`}
                  disabled={rowBusyId === page._id}
                  onClick={() => togglePublished(page)}
                >
                  {page.published ? "Unpublish" : "Publish"}
                </button>
                {page.published ? (
                  <a
                    className="btn btn-sm btn-outline-dark"
                    href={`/page/${page.slug}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open
                  </a>
                ) : (
                  <button type="button" className="btn btn-sm btn-outline-dark" disabled>
                    Open
                  </button>
                )}
                <button className="btn btn-sm btn-outline-primary" onClick={() => startEdit(page)}>
                  Edit
                </button>
                <button className="btn btn-sm btn-outline-danger" onClick={() => remove(page._id)}>
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Layout>
  );
}

