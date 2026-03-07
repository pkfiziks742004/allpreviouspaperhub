import { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { API_BASE, resolveApiUrl } from "../config/api";
import { applySeoByPage, applySeoByRoute } from "../utils/seo";
import { getSettings } from "../utils/siteData";

const FALLBACK_SEO = {
  title: "About Us | Study Portal",
  description:
    "Study Portal ke bare me jankari: mission, content quality, aur student support.",
  keywords: "study portal, about us, question papers, notes, syllabus"
};

const DEFAULT_ABOUT_HIGHLIGHTS = [
  { value: "01", label: "University/College/School wise browsing" },
  { value: "02", label: "Course & semester level navigation" },
  { value: "03", label: "Question paper search + year filters" },
  { value: "04", label: "Admin managed updates and content control" }
];

const DEFAULT_ABOUT_INFO_BLOCKS = [
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
];

export default function AboutUs() {
  const [managedAbout, setManagedAbout] = useState(null);
  const [loading, setLoading] = useState(true);

  const resolveUrl = url => resolveApiUrl(url);
  const normalizeContentHtml = html => {
    const source = String(html || "");
    if (!source) return "";
    return source
      .replace(/https?:\/\/localhost:5000\/uploads\//gi, `${API_BASE}/uploads/`)
      .replace(/https?:\/\/127\.0\.0\.1:5000\/uploads\//gi, `${API_BASE}/uploads/`);
  };
  const hasRenderableContent = html => {
    const source = String(html || "").trim();
    if (!source) return false;
    if (/<img|<video|<iframe|<table|<ul|<ol|<blockquote/i.test(source)) return true;
    const textOnly = source.replace(/<[^>]+>/g, "").trim();
    return textOnly.length > 0;
  };

  useEffect(() => {
    let mounted = true;

    const applySeo = async () => {
      setLoading(true);
      try {
        const [settingsRes, aboutRes] = await Promise.all([
          getSettings({ ttlMs: 45_000 }),
          axios.get(`${API_BASE}/api/pages/slug/about`).catch(() => ({ data: null }))
        ]);
        const settings = settingsRes || {};
        const about = aboutRes.data || null;
        if (!mounted) return;
        setManagedAbout(about);
        const context = { page: "about" };
        const hasRouteSeo = applySeoByRoute({
          settings,
          context,
          pathname: window.location.pathname
        });
        if (!hasRouteSeo) {
          applySeoByPage({
            settings,
            pageKey: "about",
            context,
            fallback: {
              title: about?.seoTitle || about?.title || FALLBACK_SEO.title,
              description: about?.seoDescription || FALLBACK_SEO.description,
              keywords: about?.seoKeywords || FALLBACK_SEO.keywords,
              canonicalPath: about?.canonicalUrl || "/about"
            }
          });
        }
      } catch (err) {
        if (!mounted) return;
        setManagedAbout(null);
        applySeoByPage({
          settings: {},
          pageKey: "about",
          fallback: {
            title: FALLBACK_SEO.title,
            description: FALLBACK_SEO.description,
            keywords: FALLBACK_SEO.keywords,
            canonicalPath: "/about"
          }
        });
      } finally {
        if (mounted) setLoading(false);
      }
    };

    applySeo();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="page-shell">
      <Navbar />
      <div className="page-content">
        {loading ? (
          <section className="about-page py-5">
            <div className="container">
              <div className="about-hero mb-4">
                <p className="about-eyebrow">Loading</p>
                <h1 className="about-title">Please wait...</h1>
              </div>
            </div>
          </section>
        ) : managedAbout ? (
          <section className="about-page py-5" style={{ backgroundColor: managedAbout?.bgColor || "" }}>
            <div className="container">
              {managedAbout?.bannerUrl && (
                <div className="custom-page-banner mb-4">
                  <img src={resolveUrl(managedAbout.bannerUrl)} alt={managedAbout.title || "About banner"} />
                </div>
              )}
              <div className="about-hero mb-4">
                <p className="about-eyebrow">{managedAbout?.extra?.heroEyebrow || "About Website"}</p>
                <h1 className="about-title">{managedAbout?.title || "About Us"}</h1>
                {managedAbout?.extra?.heroLead ? (
                  <p className="about-lead mb-0">{managedAbout.extra.heroLead}</p>
                ) : null}
              </div>
              {(managedAbout?.extra?.author?.name ||
                managedAbout?.extra?.author?.role ||
                managedAbout?.extra?.author?.bio ||
                managedAbout?.extra?.author?.image) && (
                <div className="about-author-card mb-4">
                  {managedAbout?.extra?.author?.image ? (
                    <img
                      src={resolveUrl(managedAbout.extra.author.image)}
                      alt={managedAbout?.extra?.author?.name || "Author"}
                      className="about-author-image"
                    />
                  ) : null}
                  <div className="about-author-meta">
                    {managedAbout?.extra?.author?.name ? (
                      <h5 className="mb-1">{managedAbout.extra.author.name}</h5>
                    ) : null}
                    {managedAbout?.extra?.author?.role ? (
                      <div className="about-author-role mb-2">{managedAbout.extra.author.role}</div>
                    ) : null}
                    {managedAbout?.extra?.author?.bio ? (
                      <p className="mb-0">{managedAbout.extra.author.bio}</p>
                    ) : null}
                  </div>
                </div>
              )}
              {hasRenderableContent(normalizeContentHtml(managedAbout?.contentHtml)) ? (
                <div
                  className="about-block about-managed-content mb-4"
                  dangerouslySetInnerHTML={{ __html: normalizeContentHtml(managedAbout?.contentHtml) }}
                />
              ) : null}

              <div className="row g-3 g-md-4 mb-4">
                {(managedAbout?.extra?.highlights || DEFAULT_ABOUT_HIGHLIGHTS).slice(0, 4).map((item, idx) => (
                  <div className="col-6 col-lg-3" key={`about-highlight-${idx}`}>
                    <div className="about-stat">
                      <span className="about-stat-value">{item?.value || `${idx + 1}`}</span>
                      <span className="about-stat-label">{item?.label || ""}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="row g-4">
                {(managedAbout?.extra?.infoBlocks || DEFAULT_ABOUT_INFO_BLOCKS).slice(0, 4).map((item, idx) => (
                  <div className="col-md-6" key={`about-info-${idx}`}>
                    <div className="about-block h-100">
                      <h5>{item?.title || `Section ${idx + 1}`}</h5>
                      <p className="mb-0">{item?.body || ""}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : (
          <section className="about-page py-5">
            <div className="container">
              <div className="about-hero mb-4 mb-lg-5">
                <p className="about-eyebrow">About Study Portal</p>
                <h1 className="about-title">Yeh Website Kya Karti Hai?</h1>
                <p className="about-lead mb-0">
                  Study Portal students ko previous year papers, notes, syllabus aur exam prep resources
                  ek single platform par provide karta hai. Website ka focus fast access, clean structure
                  aur practical study flow par hai.
                </p>
              </div>

              <div className="row g-3 g-md-4 mb-4 mb-lg-5">
                <div className="col-6 col-lg-3">
                  <div className="about-stat">
                    <span className="about-stat-value">01</span>
                    <span className="about-stat-label">University/College/School wise browsing</span>
                  </div>
                </div>
                <div className="col-6 col-lg-3">
                  <div className="about-stat">
                    <span className="about-stat-value">02</span>
                    <span className="about-stat-label">Course & semester level navigation</span>
                  </div>
                </div>
                <div className="col-6 col-lg-3">
                  <div className="about-stat">
                    <span className="about-stat-value">03</span>
                    <span className="about-stat-label">Question paper search + year filters</span>
                  </div>
                </div>
                <div className="col-6 col-lg-3">
                  <div className="about-stat">
                    <span className="about-stat-value">04</span>
                    <span className="about-stat-label">Admin managed updates and content control</span>
                  </div>
                </div>
              </div>

              <div className="row g-4">
                <div className="col-md-6">
                  <div className="about-block h-100">
                    <h5>How It Works</h5>
                    <p className="mb-0">
                      User pehle university/college/school card select karta hai, phir course, semester
                      aur finally relevant question papers tak pohanchta hai. Is flow se irrelevant content
                      skip hota hai aur prep faster hoti hai.
                    </p>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="about-block h-100">
                    <h5>Why This Platform</h5>
                    <p className="mb-0">
                      Internet par scattered files ki jagah curated, categorized aur accessible system diya gaya
                      hai. Mobile/tablet/laptop sab me same structured experience maintain kiya gaya hai.
                    </p>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="about-block h-100">
                    <h5>Who Can Use</h5>
                    <p className="mb-0">
                      School boards, colleges, universities aur entrance exam aspirants sab ke liye website
                      ko type-based sections ke saath organize kiya gaya hai.
                    </p>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="about-block h-100">
                    <h5>Support & Corrections</h5>
                    <p className="mb-0">
                      Agar kisi paper, title ya category me correction chahiye ho to footer contact details
                      se request bheji ja sakti hai. Admin panel se updates directly push ki jaati hain.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
      <div className="footer-top-gap" />
      <Footer />
    </div>
  );
}
