import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { API_BASE, resolveApiUrl } from "../config/api";
import { getSettings } from "../utils/siteData";

export default function Footer() {
  const [avg, setAvg] = useState(0);
  const [footerText, setFooterText] = useState("Study Portal");
  const [ratingEnabled, setRatingEnabled] = useState(true);
  const [footerStyle, setFooterStyle] = useState({});
  const [footerUseSplitColor, setFooterUseSplitColor] = useState(false);
  const [footerNamePart1, setFooterNamePart1] = useState("");
  const [footerNamePart1Color, setFooterNamePart1Color] = useState("#ffffff");
  const [footerNamePart2, setFooterNamePart2] = useState("");
  const [footerNamePart2Color, setFooterNamePart2Color] = useState("#fbbf24");
  const [footerBgColor, setFooterBgColor] = useState("#212529");
  const [footerBgImage, setFooterBgImage] = useState("");
  const [footerLogoUrl, setFooterLogoUrl] = useState("");
  const [footerLogoHeight, setFooterLogoHeight] = useState(32);
  const [footerLogoAlign, setFooterLogoAlign] = useState("left");
  const [footerSocialIcons, setFooterSocialIcons] = useState([]);
  const [footerSocialIconSize, setFooterSocialIconSize] = useState(36);
  const [footerSocialIconRadius, setFooterSocialIconRadius] = useState(10);
  const [footerSocialIconBgColor, setFooterSocialIconBgColor] = useState("#ffffff");
  const [footerSocialIconBorderColor, setFooterSocialIconBorderColor] = useState("#ffffff00");
  const [footerSocialIconBorderWidth, setFooterSocialIconBorderWidth] = useState(0);
  const [footerColumns, setFooterColumns] = useState([]);
  const [footerLinkFontSize, setFooterLinkFontSize] = useState(14);
  const [footerContactTitle, setFooterContactTitle] = useState("Contact");
  const [footerContactLines, setFooterContactLines] = useState([]);
  const [footerContactTextStyle, setFooterContactTextStyle] = useState({ color: "#ffffff", bold: false, italic: false, size: 14 });
  const [footerRatingNoteTitle, setFooterRatingNoteTitle] = useState("");
  const [footerRatingNoteText, setFooterRatingNoteText] = useState("");
  const [footerRatingNoteLink, setFooterRatingNoteLink] = useState("");
  const [footerRatingNoteBgColor, setFooterRatingNoteBgColor] = useState("rgba(255,255,255,0.08)");
  const [footerRatingNoteTextColor, setFooterRatingNoteTextColor] = useState("#ffffff");
  const [copyrightEnabled, setCopyrightEnabled] = useState(false);
  const [copyrightText, setCopyrightText] = useState("");
  const [copyrightColor, setCopyrightColor] = useState("#f8f9fa");
  const [copyrightTextColor, setCopyrightTextColor] = useState("#000000");
  const [copyrightHeight, setCopyrightHeight] = useState(32);
  const [copyrightFontSize, setCopyrightFontSize] = useState(14);
  const [ready, setReady] = useState(false);

  const resolveUrl = url => {
    return resolveApiUrl(url);
  };

  useEffect(() => {
    getSettings({ ttlMs: 45_000 })
      .then(data => {
        if (data && data.footerText) {
          setFooterText(data.footerText);
        }
        if (data && typeof data.ratingEnabled === "boolean") {
          setRatingEnabled(data.ratingEnabled);
        }
        setFooterStyle(data.footerStyle || {});
        setFooterUseSplitColor(!!data.footerUseSplitColor);
        setFooterNamePart1(data.footerNamePart1 || "");
        setFooterNamePart1Color(data.footerNamePart1Color || "#ffffff");
        setFooterNamePart2(data.footerNamePart2 || "");
        setFooterNamePart2Color(data.footerNamePart2Color || "#fbbf24");
        setFooterBgColor(data.footerBgColor || "#212529");
        setFooterBgImage(data.footerBgImage || "");
        setFooterLogoUrl(data.footerLogoUrl || "");
        setFooterLogoHeight(data.footerLogoHeight || 32);
        setFooterLogoAlign(data.footerLogoAlign || "left");
        setFooterSocialIcons(Array.isArray(data.footerSocialIcons) ? data.footerSocialIcons : []);
        setFooterSocialIconSize(data.footerSocialIconSize || 36);
        setFooterSocialIconRadius(data.footerSocialIconRadius || 10);
        setFooterSocialIconBgColor(data.footerSocialIconBgColor || "#ffffff");
        setFooterSocialIconBorderColor(data.footerSocialIconBorderColor || "#ffffff00");
        setFooterSocialIconBorderWidth(data.footerSocialIconBorderWidth || 0);
        setFooterColumns(Array.isArray(data.footerColumns) ? data.footerColumns : []);
        setFooterLinkFontSize(data.footerLinkFontSize || 14);
        setFooterContactTitle(data.footerContactTitle || "Contact");
        setFooterContactLines(Array.isArray(data.footerContactLines) ? data.footerContactLines : []);
        setFooterContactTextStyle(data.footerContactTextStyle || { color: "#ffffff", bold: false, italic: false, size: 14 });
        setFooterRatingNoteTitle(data.footerRatingNoteTitle || "");
        setFooterRatingNoteText(data.footerRatingNoteText || "");
        setFooterRatingNoteLink(data.footerRatingNoteLink || "");
        setFooterRatingNoteBgColor(data.footerRatingNoteBgColor || "rgba(255,255,255,0.08)");
        setFooterRatingNoteTextColor(data.footerRatingNoteTextColor || "#ffffff");
        setCopyrightEnabled(!!data.copyrightEnabled);
        setCopyrightText(data.copyrightText || "");
        setCopyrightColor(data.copyrightColor || "#f8f9fa");
        setCopyrightTextColor(data.copyrightTextColor || "#000000");
        setCopyrightHeight(data.copyrightHeight || 32);
        setCopyrightFontSize(data.copyrightFontSize || 14);
        setReady(true);
      })
      .catch(() => setReady(false));
  }, []);

  useEffect(() => {
    if (!ratingEnabled) return;
    axios
      .get(`${API_BASE}/api/site-rating`)
      .then(res => setAvg(res.data.avg));
  }, [ratingEnabled]);

  const textStyle = {
    color: footerStyle.color || "#ffffff",
    fontWeight: footerStyle.bold ? "700" : "normal",
    fontStyle: footerStyle.italic ? "italic" : "normal",
    textAlign: footerStyle.align || "center"
  };

  const FooterTag = footerStyle.variant || "p";
  const contactStyle = {
    color: footerContactTextStyle.color || "#ffffff",
    fontWeight: footerContactTextStyle.bold ? "700" : "normal",
    fontStyle: footerContactTextStyle.italic ? "italic" : "normal",
    fontSize: footerContactTextStyle.size ? `${footerContactTextStyle.size}px` : undefined
  };
  const hasContact = Boolean(footerContactTitle) || footerContactLines.length > 0;
  const showRatingColumn = ratingEnabled;
  const hasRatingNote = Boolean(footerRatingNoteTitle) || Boolean(footerRatingNoteText);
  const displayColumns =
    Array.isArray(footerColumns) && footerColumns.length > 0
      ? footerColumns
      : [{ title: "COLUMN 1", links: [] }, { title: "COLUMN 2", links: [] }, { title: "COLUMN 3", links: [] }];
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  if (!ready) return null;

  return (
    <footer
      className="site-footer"
      style={{
        backgroundColor: footerBgColor,
        backgroundImage: footerBgImage ? `url(${resolveUrl(footerBgImage)})` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center"
      }}
    >
      <div className="container footer-wrap">
        <div className="footer-panel">
          <div className="footer-top">
            <div className="footer-brand" style={{ textAlign: footerLogoAlign }}>
              {!footerLogoUrl && (
                footerUseSplitColor ? (
                  <FooterTag style={textStyle}>
                    <span style={{ color: footerNamePart1Color }}>{footerNamePart1}</span>
                    <span style={{ color: footerNamePart2Color }}>{footerNamePart2}</span>
                  </FooterTag>
                ) : (
                  <FooterTag style={textStyle}>{footerText}</FooterTag>
                )
              )}
              {footerLogoUrl && (
                <div className="footer-logo">
                  <img
                    src={resolveUrl(footerLogoUrl)}
                    alt="Footer Logo"
                    style={{ height: `${footerLogoHeight}px`, width: "auto" }}
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              )}
              {hasContact && (
                <div className="footer-contact">
                  {footerContactTitle && (
                    <div className="footer-contact-title" style={contactStyle}>
                      {footerContactTitle}
                    </div>
                  )}
                  <div className="footer-contact-lines">
                    {footerContactLines.map((line, idx) => (
                      <div key={`contact-${idx}`} style={contactStyle}>
                        {line}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {footerSocialIcons.length > 0 && (
                <div
                  className="footer-social"
                  style={{
                    justifyContent:
                      footerLogoAlign === "left"
                        ? "flex-start"
                        : footerLogoAlign === "right"
                          ? "flex-end"
                          : "center"
                  }}
                >
                  {footerSocialIcons.map((icon, idx) => (
                    <a
                      key={`icon-${idx}`}
                      href={icon.link || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="footer-social-link"
                      style={{
                        width: `${footerSocialIconSize}px`,
                        height: `${footerSocialIconSize}px`,
                        borderRadius: `${footerSocialIconRadius}px`,
                        background: footerSocialIconBgColor,
                        border: `${footerSocialIconBorderWidth}px solid ${footerSocialIconBorderColor}`
                      }}
                    >
                      {icon.imageUrl && (
                        <img
                          src={resolveUrl(icon.imageUrl)}
                          alt="icon"
                          style={{
                            height: `${Math.max(14, footerSocialIconSize - 8)}px`,
                            width: `${Math.max(14, footerSocialIconSize - 8)}px`,
                            objectFit: "contain"
                          }}
                          loading="lazy"
                          decoding="async"
                        />
                      )}
                    </a>
                  ))}
                </div>
              )}
              <button type="button" className="footer-back-top" onClick={scrollToTop}>
                Back To Top
              </button>
            </div>

            <div className="footer-columns">
              {displayColumns.map((col, idx) => (
                <div key={`fcol-${idx}`} className="footer-col">
                  {col.title && <h6>{col.title}</h6>}
                  <ul className="list-unstyled">
                    {(col.links || []).map((link, lidx) => (
                      <li key={`link-${idx}-${lidx}`}>
                        {String(link.url || "").startsWith("http") ? (
                          <a
                            href={link.url || "#"}
                            className="text-white text-decoration-none"
                            style={{ fontSize: footerLinkFontSize ? `${footerLinkFontSize}px` : undefined }}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {link.label || "Link"}
                          </a>
                        ) : (
                          <Link
                            to={link.url || "/"}
                            className="text-white text-decoration-none"
                            style={{ fontSize: footerLinkFontSize ? `${footerLinkFontSize}px` : undefined }}
                          >
                            {link.label || "Link"}
                          </Link>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {showRatingColumn && (
              <div className="footer-rating">
                {hasRatingNote && (
                  <a
                    className="footer-rating-note"
                    href={footerRatingNoteLink || "#"}
                    target={footerRatingNoteLink && footerRatingNoteLink.startsWith("http") ? "_blank" : undefined}
                    rel={footerRatingNoteLink && footerRatingNoteLink.startsWith("http") ? "noopener noreferrer" : undefined}
                    style={{
                      background: footerRatingNoteBgColor || "rgba(255,255,255,0.08)",
                      color: footerRatingNoteTextColor || "#ffffff",
                      pointerEvents: footerRatingNoteLink ? "auto" : "none"
                    }}
                  >
                    {footerRatingNoteTitle && <div className="footer-rating-note-title">{footerRatingNoteTitle}</div>}
                    {footerRatingNoteText && <div className="footer-rating-note-text">{footerRatingNoteText}</div>}
                  </a>
                )}
                {ratingEnabled && (
                  <>
                    <div className="footer-stars">
                      {[1, 2, 3, 4, 5].map(s => (
                        <span
                          key={`footer-${s}`}
                          style={{
                            fontSize: "18px",
                            color: s <= Math.round(Number(avg) || 0) ? "gold" : "lightgray"
                          }}
                        >
                          {"\u2605"}
                        </span>
                      ))}
                    </div>
                    <div className="footer-rating-text">Website Rating: {avg}/5</div>
                  </>
                )}
              </div>
            )}
          </div>

          {copyrightEnabled && copyrightText && (
            <div
              className="footer-copyright"
              style={{
                backgroundColor: copyrightColor,
                color: copyrightTextColor,
                minHeight: copyrightHeight ? `${copyrightHeight}px` : undefined,
                fontSize: copyrightFontSize ? `${copyrightFontSize}px` : undefined
              }}
            >
              {copyrightText}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}

