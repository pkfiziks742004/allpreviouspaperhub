import { useEffect, useState } from "react";
import axios from "axios";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { API_BASE, resolveApiUrl } from "../config/api";
import { applySeoByRoute } from "../utils/seo";

const FALLBACK_SEO = {
  title: "Privacy Policy | All Previous Paper Hub",
  description:
    "Privacy Policy for All Previous Paper Hub: data collection, usage, cookies, and contact information.",
  keywords: "privacy policy, all previous paper hub, data policy, cookies policy"
};

const FALLBACK_HTML = `
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
  <h3>3. Cookies</h3>
  <p>
    Website cookies use kar sakti hai for session handling, analytics, and preferences. Aap browser settings me cookies manage kar sakte hain.
  </p>
  <h3>4. Third-Party Services</h3>
  <p>
    Analytics, ads, ya embedded services third-party policies ke under ho sakte hain. Un services ki privacy policy alag hogi.
  </p>
  <h3>5. Contact</h3>
  <p>
    Agar privacy related concern ho, to website footer me available contact details par reach karein.
  </p>
`;

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
  let link = document.querySelector("link[rel='canonical']");
  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", "canonical");
    document.head.appendChild(link);
  }
  link.setAttribute("href", href);
};

export default function PrivacyPolicy() {
  const [managedPage, setManagedPage] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const [settingsRes, pageRes] = await Promise.all([
          axios.get(`${API_BASE}/api/settings`),
          axios.get(`${API_BASE}/api/pages/slug/privacy-policy`).catch(() => ({ data: null }))
        ]);
        if (!mounted) return;
        setSettings(settingsRes.data || {});
        setManagedPage(pageRes.data || null);
      } catch (err) {
        if (!mounted) return;
        setSettings({});
        setManagedPage(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (loading) return;
    const currentSettings = settings || {};
    const hasRouteSeo = applySeoByRoute({
      settings: currentSettings,
      context: { page: "privacy-policy" },
      pathname: window.location.pathname
    });
    if (hasRouteSeo) return;

    const title = (managedPage?.seoTitle || managedPage?.title || FALLBACK_SEO.title).trim();
    const description = (managedPage?.seoDescription || FALLBACK_SEO.description).trim();
    const keywords = (managedPage?.seoKeywords || FALLBACK_SEO.keywords).trim();
    const canonical =
      (managedPage?.canonicalUrl || `${window.location.origin}/privacy-policy`).trim();

    document.title = title;
    ensureMeta("description", description);
    ensureMeta("keywords", keywords);
    ensureMeta("og:title", title, "property");
    ensureMeta("og:description", description, "property");
    ensureMeta("twitter:title", title);
    ensureMeta("twitter:description", description);
    if (managedPage?.seoImage || currentSettings?.ogImage) {
      const img = resolveApiUrl(managedPage?.seoImage || currentSettings?.ogImage);
      ensureMeta("og:image", img, "property");
      ensureMeta("twitter:image", img);
    }
    ensureCanonical(canonical);
  }, [loading, settings, managedPage]);

  return (
    <div className="page-shell">
      <Navbar />
      <div className="page-content">
        <section className="about-page py-5">
          <div className="container">
            {loading ? (
              <div className="about-hero mb-4">
                <p className="about-eyebrow">Loading</p>
                <h1 className="about-title">Please wait...</h1>
              </div>
            ) : (
              <>
                <div className="about-hero mb-4">
                  <p className="about-eyebrow">{managedPage?.extra?.heroEyebrow || "Legal"}</p>
                  <h1 className="about-title">{managedPage?.title || "Privacy Policy"}</h1>
                </div>
                <div
                  className="about-block about-managed-content"
                  dangerouslySetInnerHTML={{ __html: managedPage?.contentHtml || FALLBACK_HTML }}
                />
              </>
            )}
          </div>
        </section>
      </div>
      <div className="footer-top-gap" />
      <Footer />
    </div>
  );
}
