import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { API_BASE, resolveApiUrl } from "../config/api";

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
        if (res.data?.seoTitle) {
          document.title = res.data.seoTitle;
        } else if (res.data?.title) {
          document.title = res.data.title;
        }
        if (res.data?.seoDescription) {
          let tag = document.querySelector("meta[name='description']");
          if (!tag) {
            tag = document.createElement("meta");
            tag.setAttribute("name", "description");
            document.head.appendChild(tag);
          }
          tag.setAttribute("content", res.data.seoDescription);
        }
        if (res.data?.seoKeywords) {
          let tag = document.querySelector("meta[name='keywords']");
          if (!tag) {
            tag = document.createElement("meta");
            tag.setAttribute("name", "keywords");
            document.head.appendChild(tag);
          }
          tag.setAttribute("content", res.data.seoKeywords);
        }
        if (res.data?.canonicalUrl) {
          let link = document.querySelector("link[rel='canonical']");
          if (!link) {
            link = document.createElement("link");
            link.setAttribute("rel", "canonical");
            document.head.appendChild(link);
          }
          link.setAttribute("href", res.data.canonicalUrl);
        }
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
