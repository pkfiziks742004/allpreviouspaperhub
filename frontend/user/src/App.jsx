import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";

import Home from "./pages/Home";
import Courses from "./pages/Courses";
import Semesters from "./pages/Semesters";
import Papers from "./pages/Papers";
import PaperOpen from "./pages/PaperOpen";
import CustomPage from "./pages/CustomPage";
import AboutUs from "./pages/AboutUs";
import { API_BASE, resolveApiUrl } from "./config/api";
import { AdsProvider } from "./context/AdsContext";

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
        script.setAttribute(attr.name, attr.value);
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
    const inject = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/ads-settings`);
        setAdsSettings({
          enabled: !!res.data?.enabled,
          headScript: res.data?.headScript || "",
          bodyScript: res.data?.bodyScript || "",
          adsTxt: res.data?.adsTxt || ""
        });
        if (!res.data || !res.data.enabled) return;

        if (res.data.headScript) {
          injectSnippetOnce(res.data.headScript, document.head, "ads-head", "data-ads-snippet");
        }

        if (res.data.bodyScript) {
          const snippet = String(res.data.bodyScript || "");
          const hasAdUnitMarkup = snippet.includes("<ins") || snippet.includes("adsbygoogle");
          if (!hasAdUnitMarkup) {
            injectSnippetOnce(snippet, document.body, "ads-body", "data-ads-snippet");
          }
        }
      } catch (e) {
        // ignore
      }
    };

    inject();
  }, []);

  useEffect(() => {
    const applyFavicon = iconUrl => {
      if (!iconUrl) return;
      const cacheBusted = `${iconUrl}${iconUrl.includes("?") ? "&" : "?"}v=${Date.now()}`;
      const ids = ["dynamic-favicon", "dynamic-shortcut-icon", "dynamic-apple-touch-icon"];
      ids.forEach(id => {
        const link = document.getElementById(id);
        if (link) link.href = cacheBusted;
      });
    };

    const applySettings = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/settings`, {
          params: { _ts: Date.now() }
        });
        if (res.data) {
          setMaintenanceEnabled(!!res.data.maintenanceEnabled);
          setMaintenanceMessage(
            res.data.maintenanceMessage ||
              "We are under maintenance. Please check back soon."
          );
        }

        if (res.data && res.data.faviconUrl) {
          applyFavicon(resolveApiUrl(res.data.faviconUrl));
        }

        if (res.data && res.data.pageBgColor) {
          document.body.style.backgroundColor = res.data.pageBgColor;
        }

        if (res.data && res.data.userPageTitle) {
          document.title = res.data.userPageTitle;
          try {
            localStorage.setItem("user_page_title_cache", String(res.data.userPageTitle || "").trim());
          } catch (e) {
            // ignore storage errors
          }
          let appTitleMeta = document.querySelector("meta[name='apple-mobile-web-app-title']");
          if (!appTitleMeta) {
            appTitleMeta = document.createElement("meta");
            appTitleMeta.setAttribute("name", "apple-mobile-web-app-title");
            document.head.appendChild(appTitleMeta);
          }
          appTitleMeta.setAttribute("content", res.data.userPageTitle);
        } else if (res.data && res.data.seoTitle) {
          document.title = res.data.seoTitle;
          try {
            localStorage.setItem("user_page_title_cache", String(res.data.seoTitle || "").trim());
          } catch (e) {
            // ignore storage errors
          }
          let appTitleMeta = document.querySelector("meta[name='apple-mobile-web-app-title']");
          if (!appTitleMeta) {
            appTitleMeta = document.createElement("meta");
            appTitleMeta.setAttribute("name", "apple-mobile-web-app-title");
            document.head.appendChild(appTitleMeta);
          }
          appTitleMeta.setAttribute("content", res.data.seoTitle);
        }

        const ensureMeta = (key, value, attr = "name") => {
          if (!value) return;
          let tag = document.querySelector(`meta[${attr}='${key}']`);
          if (!tag) {
            tag = document.createElement("meta");
            tag.setAttribute(attr, key);
            document.head.appendChild(tag);
          }
          tag.setAttribute("content", value);
        };

        ensureMeta("description", res.data?.seoDescription || "");
        ensureMeta("keywords", res.data?.seoKeywords || "");
        ensureMeta("og:title", res.data?.seoTitle || "", "property");
        ensureMeta("og:description", res.data?.seoDescription || "", "property");
        ensureMeta("og:site_name", res.data?.userPageTitle || res.data?.seoTitle || "All Previous Paper Hub", "property");
        ensureMeta("twitter:title", res.data?.seoTitle || res.data?.userPageTitle || "");
        ensureMeta("twitter:description", res.data?.seoDescription || "");
        if (res.data?.ogImage) {
          ensureMeta("og:image", resolveApiUrl(res.data.ogImage), "property");
          ensureMeta("twitter:image", resolveApiUrl(res.data.ogImage));
        }

        if (res.data?.canonicalUrl) {
          let link = document.querySelector("link[rel='canonical']");
          if (!link) {
            link = document.createElement("link");
            link.setAttribute("rel", "canonical");
            document.head.appendChild(link);
          }
          link.setAttribute("href", res.data.canonicalUrl);
          ensureMeta("og:url", res.data.canonicalUrl, "property");
        }

        if (res.data?.analyticsHeadScript) {
          injectSnippetOnce(
            res.data.analyticsHeadScript,
            document.head,
            "analytics-head",
            "data-analytics-snippet"
          );
        }

        if (res.data?.analyticsBodyScript) {
          injectSnippetOnce(
            res.data.analyticsBodyScript,
            document.body,
            "analytics-body",
            "data-analytics-snippet"
          );
        }
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
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/course/:id" element={<Semesters />} />
          <Route path="/papers/:id" element={<Papers />} />
          <Route path="/paper-open/:id" element={<PaperOpen />} />
          <Route path="/page/:slug" element={<CustomPage />} />
          <Route path="/about" element={<AboutUs />} />
        </Routes>
      </BrowserRouter>
    </AdsProvider>
  );
}

export default App;
