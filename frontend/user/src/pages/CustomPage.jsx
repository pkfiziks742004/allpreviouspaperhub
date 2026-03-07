import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { API_BASE, resolveApiUrl } from "../config/api";

const ensureMeta = (key, value, attr = "name") => {
  let tag = document.querySelector(`meta[${attr}='${key}']`);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute(attr, key);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", value || "");
};

const ensureCanonical = href => {
  if (!href) return;
  let link = document.querySelector("link[rel='canonical']");
  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", "canonical");
    document.head.appendChild(link);
  }
  link.setAttribute("href", href);
  ensureMeta("og:url", href, "property");
};

export default function CustomPage() {
  const { slug } = useParams();
  const [page, setPage] = useState(null);
  const [notFound, setNotFound] = useState(false);

  const resolveUrl = url => {
    return resolveApiUrl(url);
  };

  useEffect(() => {
    setNotFound(false);
    setPage(null);
    if (!slug) {
      setNotFound(true);
      return;
    }
    axios
      .get(`${API_BASE}/api/pages/slug/${slug}`)
      .then(res => {
        setPage(res.data);
        const seoTitle = String(res.data?.seoTitle || res.data?.title || "All Previous Paper Hub").trim();
        const seoDescription = String(
          res.data?.seoDescription || `${res.data?.title || "Page"} - All Previous Paper Hub`
        ).trim();
        const seoKeywords = String(res.data?.seoKeywords || "").trim();
        const seoImage = resolveUrl(res.data?.seoImage || "");
        const canonical = String(
          res.data?.canonicalUrl || `${window.location.origin}/page/${slug}`
        ).trim();

        document.title = seoTitle;
        ensureMeta("description", seoDescription);
        ensureMeta("keywords", seoKeywords);
        ensureMeta("og:title", seoTitle, "property");
        ensureMeta("og:description", seoDescription, "property");
        ensureMeta("twitter:title", seoTitle);
        ensureMeta("twitter:description", seoDescription);
        if (seoImage) {
          ensureMeta("og:image", seoImage, "property");
          ensureMeta("twitter:image", seoImage);
        }
        ensureCanonical(canonical);
      })
      .catch(() => setNotFound(true));
  }, [slug]);

  return (
    <div className="page-shell">
      <Navbar />
      <div className="page-content">
        <div
          className="custom-page"
          style={{ backgroundColor: page?.bgColor || "#ffffff" }}
        >
        {page?.bannerUrl && (
          <div className="custom-page-banner">
            <img src={resolveUrl(page.bannerUrl)} alt={page.title || "Banner"} />
          </div>
        )}

        <div className="container custom-page-content">
          {notFound && (
            <div className="alert alert-warning mt-4">Page not found.</div>
          )}
          {page && (
            <>
              <h2 className="custom-page-title">{page.title}</h2>
              <div
                className="custom-page-body"
                dangerouslySetInnerHTML={{ __html: page.contentHtml || "" }}
              />
            </>
          )}
        </div>
      </div>
      </div>
      <div className="footer-top-gap" />
      <Footer />
    </div>
  );
}
