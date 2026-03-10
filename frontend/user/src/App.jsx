import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense, useEffect, useState } from "react";

import { API_BASE, resolveApiUrl } from "./config/api";
import { AdsProvider } from "./context/AdsContext";
import { getSettings } from "./utils/siteData";
import { getJson } from "./utils/http";

const Home = lazy(() => import("./pages/Home"));
const Courses = lazy(() => import("./pages/Courses"));
const Semesters = lazy(() => import("./pages/Semesters"));
const Papers = lazy(() => import("./pages/Papers"));
const PaperOpen = lazy(() => import("./pages/PaperOpen"));
const CustomPage = lazy(() => import("./pages/CustomPage"));
const AboutUs = lazy(() => import("./pages/AboutUs"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));

const DEFAULT_SITE_TITLE = "All Previous Paper Hub";
const DEFAULT_SEO_DESCRIPTION =
  "All Previous Paper Hub - Previous year papers, notes, syllabus, and exam resources.";

const scheduleDeferred = (task, timeout = 1500) => {
  if (typeof window === "undefined") return () => {};

  if ("requestIdleCallback" in window) {
    const id = window.requestIdleCallback(task, { timeout });
    return () => window.cancelIdleCallback?.(id);
  }

  const timer = window.setTimeout(task, timeout);
  return () => window.clearTimeout(timer);
};

const normalizeExternalScriptSrc = src => {
  const value = String(src || "").trim();
  if (!value) return value;

  const gtagMatch = value.match(/https:\/\/www\.googletagmanager\.com\/gtag\/js\?id=([A-Za-z0-9_-]+)/i);
  if (gtagMatch) {
    return `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gtagMatch[1])}`;
  }

  return value;
};

const injectSnippetOnce = (snippet, target, key, attrName = "data-snippet") => {
  const value = String(snippet || "").trim();
  if (!value || !target) return;
  if (document.querySelector(`[${attrName}='${key}']`)) return;

  const template = document.createElement("template");
  template.innerHTML = value;
  const nodes = Array.from(template.content.childNodes);

  if (!nodes.length) {
    const script = document.createElement("script");
    script.type = "text/javascript";
    script.text = value;
    script.setAttribute(attrName, key);
    target.appendChild(script);
    return;
  }

  nodes.forEach((node, idx) => {
    if (node.nodeType === Node.ELEMENT_NODE && node.nodeName.toLowerCase() === "script") {
      const oldScript = node;
      const script = document.createElement("script");
      Array.from(oldScript.attributes).forEach(attr => {
        script.setAttribute(
          attr.name,
          attr.name.toLowerCase() === "src" ? normalizeExternalScriptSrc(attr.value) : attr.value
        );
      });
      script.text = oldScript.text || oldScript.textContent || "";
      script.setAttribute(attrName, `${key}-${idx}`);
      target.appendChild(script);
      return;
    }

    const cloned = node.cloneNode(true);
    if (cloned.nodeType === Node.ELEMENT_NODE) {
      cloned.setAttribute(attrName, `${key}-${idx}`);
    }
    target.appendChild(cloned);
  });
};

function App() {
  const [maintenanceEnabled, setMaintenanceEnabled] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState("");
  const [adsSettings, setAdsSettings] = useState({
    enabled: false,
    headScript: "",
    bodyScript: "",
    adsTxt: ""
  });

  useEffect(() => {
    const loadDeferredStyles = () => {
      import("./deferred.css").catch(() => {});
    };

    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(loadDeferredStyles, { timeout: 1200 });
      return () => window.cancelIdleCallback?.(id);
    }

    const timer = window.setTimeout(loadDeferredStyles, 250);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const injectDeferredFeatures = () => {
      import("./reportWebVitals").then(({ default: reportWebVitals }) => {
        if (typeof reportWebVitals === "function") {
          reportWebVitals();
        }
      }).catch(() => {});
    };

    return scheduleDeferred(injectDeferredFeatures, 6000);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const inject = async () => {
      try {
        const data = await getJson(`${API_BASE}/api/ads-settings`);
        if (cancelled) return;
        setAdsSettings({
          enabled: !!data?.enabled,
          headScript: data?.headScript || "",
          bodyScript: data?.bodyScript || "",
          adsTxt: data?.adsTxt || ""
        });
        if (!data || !data.enabled) return;

        if (data.headScript) {
          injectSnippetOnce(data.headScript, document.head, "ads-head", "data-ads-snippet");
        }

        if (data.bodyScript) {
          const snippet = String(data.bodyScript || "");
          const hasAdUnitMarkup = snippet.includes("<ins") || snippet.includes("adsbygoogle");
          if (!hasAdUnitMarkup) {
            injectSnippetOnce(snippet, document.body, "ads-body", "data-ads-snippet");
          }
        }
      } catch (e) {
        // ignore
      }
    };

    const cleanup = scheduleDeferred(inject, 2500);
    return () => {
      cancelled = true;
      cleanup();
    };
  }, []);

  useEffect(() => {
    const applyFavicon = iconUrl => {
      if (!iconUrl) return;
      const ids = ["dynamic-favicon", "dynamic-shortcut-icon", "dynamic-apple-touch-icon"];
      ids.forEach(id => {
        const link = document.getElementById(id);
        if (link) link.href = iconUrl;
      });
    };

    const applySettings = async () => {
      try {
        const data = await getSettings({ ttlMs: 45_000 });
        if (data) {
          setMaintenanceEnabled(!!data.maintenanceEnabled);
          setMaintenanceMessage(
            data.maintenanceMessage ||
              "We are under maintenance. Please check back soon."
          );
        }

        if (data && data.faviconUrl) {
          applyFavicon(resolveApiUrl(data.faviconUrl));
        }

        if (data && data.pageBgColor) {
          document.body.style.backgroundColor = data.pageBgColor;
        }

        const resolvedTitle = (data?.userPageTitle || data?.seoTitle || DEFAULT_SITE_TITLE).trim();
        if (resolvedTitle) {
          document.title = resolvedTitle;
          try {
            localStorage.setItem("user_page_title_cache", resolvedTitle);
          } catch (e) {
            // ignore storage errors
          }
          let appTitleMeta = document.querySelector("meta[name='apple-mobile-web-app-title']");
          if (!appTitleMeta) {
            appTitleMeta = document.createElement("meta");
            appTitleMeta.setAttribute("name", "apple-mobile-web-app-title");
            document.head.appendChild(appTitleMeta);
          }
          appTitleMeta.setAttribute("content", resolvedTitle);
        }

        const ensureMeta = (key, value, attr = "name") => {
          let tag = document.querySelector(`meta[${attr}='${key}']`);
          if (!tag) {
            tag = document.createElement("meta");
            tag.setAttribute(attr, key);
            document.head.appendChild(tag);
          }
          tag.setAttribute("content", value || "");
        };

        const resolvedDescription = (data?.seoDescription || DEFAULT_SEO_DESCRIPTION).trim();
        ensureMeta("description", resolvedDescription);
        ensureMeta("keywords", data?.seoKeywords || "");
        ensureMeta("og:title", data?.seoTitle || resolvedTitle, "property");
        ensureMeta("og:description", resolvedDescription, "property");
        ensureMeta("og:site_name", resolvedTitle, "property");
        ensureMeta("twitter:title", data?.seoTitle || resolvedTitle);
        ensureMeta("twitter:description", resolvedDescription);
        try {
          localStorage.setItem("user_seo_description_cache", resolvedDescription);
        } catch (e) {
          // ignore storage errors
        }
        if (data?.ogImage) {
          ensureMeta("og:image", resolveApiUrl(data.ogImage), "property");
          ensureMeta("twitter:image", resolveApiUrl(data.ogImage));
        }

        if (data?.canonicalUrl) {
          let link = document.querySelector("link[rel='canonical']");
          if (!link) {
            link = document.createElement("link");
            link.setAttribute("rel", "canonical");
            document.head.appendChild(link);
          }
          link.setAttribute("href", data.canonicalUrl);
          ensureMeta("og:url", data.canonicalUrl, "property");
        }

        const injectAnalytics = () => {
          if (data?.analyticsHeadScript) {
            injectSnippetOnce(
              data.analyticsHeadScript,
              document.head,
              "analytics-head",
              "data-analytics-snippet"
            );
          }

          if (data?.analyticsBodyScript) {
            injectSnippetOnce(
              data.analyticsBodyScript,
              document.body,
              "analytics-body",
              "data-analytics-snippet"
            );
          }
        };

        scheduleDeferred(injectAnalytics, 4000);
      } catch (e) {
        // ignore
      }
    };

    applySettings();
  }, []);

  if (maintenanceEnabled) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0f172a",
          color: "#ffffff",
          textAlign: "center",
          padding: "24px"
        }}
      >
        <div style={{ maxWidth: "520px" }}>
          <h2 style={{ marginBottom: "12px" }}>Maintenance Mode</h2>
          <p style={{ opacity: 0.85 }}>{maintenanceMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <AdsProvider value={adsSettings}>
      <BrowserRouter>
        <Suspense fallback={<div style={{ padding: "20px" }}>Loading...</div>}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/:universitySlug" element={<Courses />} />
            <Route path="/:universitySlug/:courseSlug" element={<Semesters />} />
            <Route path="/:universitySlug/:courseSlug/:semesterSlug" element={<Papers />} />
            <Route path="/:universitySlug/:courseSlug/:semesterSlug/:paperSlug" element={<PaperOpen />} />
            <Route path="/page/:slug" element={<CustomPage />} />
            <Route path="/about" element={<AboutUs />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AdsProvider>
  );
}

export default App;
