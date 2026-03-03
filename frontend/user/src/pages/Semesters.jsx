import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import AdSlot from "../components/AdSlot";
import { API_BASE } from "../config/api";

export default function Semesters(){

  const { id } = useParams();
  const [list,setList]=useState([]);
  const [title, setTitle] = useState("");
  const [titleStyle, setTitleStyle] = useState({});
  const [cardStyle, setCardStyle] = useState({});
  const [buttonStyle, setButtonStyle] = useState({});
  const [semesterNameStyle, setSemesterNameStyle] = useState({});
  const [sectionPanelBgColor, setSectionPanelBgColor] = useState("#ffffff");

  useEffect(()=>{

    axios
    .get(`${API_BASE}/api/semesters/${id}`)
    .then(res=>setList(res.data));

  },[id]);

  useEffect(() => {
    axios.get(`${API_BASE}/api/settings`).then(res => {
      setTitle(res.data.semestersSectionTitle || "");
      setTitleStyle(res.data.semestersTitleStyle || {});
      setCardStyle(res.data.semesterCardStyle || {});
      setButtonStyle(res.data.semesterButtonStyle || {});
      setSemesterNameStyle(res.data.semesterNameStyle || {});
      setSectionPanelBgColor(res.data.sectionPanelBgColor || "#ffffff");
    });
  }, []);

  const titleTextStyle = {
    color: titleStyle.color || "#0f172a",
    fontWeight: titleStyle.bold ? "700" : "normal",
    fontStyle: titleStyle.italic ? "italic" : "normal",
    textAlign: titleStyle.align || "left",
    fontSize: titleStyle.size ? `${titleStyle.size}px` : undefined
  };

  const cardTextStyle = {
    color: semesterNameStyle.color || cardStyle.textColor || "#0f172a",
    fontWeight: semesterNameStyle.bold ? "700" : (cardStyle.bold ? "700" : "normal"),
    fontStyle: semesterNameStyle.italic ? "italic" : (cardStyle.italic ? "italic" : "normal"),
    fontSize: semesterNameStyle.size ? `${semesterNameStyle.size}px` : (cardStyle.titleSize ? `${cardStyle.titleSize}px` : undefined),
    textAlign: semesterNameStyle.align || "center",
    width: "100%"
  };

  const hasGradient = cardStyle.gradientStart && cardStyle.gradientEnd;
  const cardBg = hasGradient
    ? `linear-gradient(135deg, ${cardStyle.gradientStart}, ${cardStyle.gradientEnd})`
    : cardStyle.bgColor || undefined;

  const semesterBtnStyle = {
    backgroundColor: buttonStyle.bgColor || undefined,
    color: buttonStyle.textColor || undefined,
    minWidth: buttonStyle.minWidth ? `${buttonStyle.minWidth}px` : "140px",
    fontSize: buttonStyle.size ? `${buttonStyle.size}px` : undefined,
    fontWeight: buttonStyle.bold ? "700" : "normal",
    fontStyle: buttonStyle.italic ? "italic" : "normal",
    borderColor: buttonStyle.bgColor || undefined
  };

  const parsedMaxWidth = Number(cardStyle.maxWidth || 0);
  const safeCardMaxWidth = parsedMaxWidth >= 260 ? `${parsedMaxWidth}px` : undefined;

  const getYearLabel = semesterName => {
    const raw = String(semesterName || "").toLowerCase().trim();
    const semesterPattern = /\b(?:sem(?:ester)?|s)\s*[-:/]?\s*(\d{1,2})\b/i;
    const reverseSemesterPattern = /\b(\d{1,2})(?:st|nd|rd|th)?\s*(?:sem(?:ester)?|s)\b/i;
    const yearPattern = /\byear\s*[-:/]?\s*(\d{1,2})\b/i;
    const ordinals = [
      { test: /\bfirst\b|\b1st\b/i, value: 1 },
      { test: /\bsecond\b|\b2nd\b/i, value: 2 },
      { test: /\bthird\b|\b3rd\b/i, value: 3 },
      { test: /\bfourth\b|\b4th\b/i, value: 4 }
    ];

    const toOrdinalYear = n => {
      if (!n || n < 1 || n > 12) return "";
      const suffix =
        n % 10 === 1 && n % 100 !== 11
          ? "st"
          : n % 10 === 2 && n % 100 !== 12
            ? "nd"
            : n % 10 === 3 && n % 100 !== 13
              ? "rd"
              : "th";
      return `${n}${suffix} Year`;
    };

    const semMatch = raw.match(semesterPattern);
    if (semMatch) {
      const semNo = Number(semMatch[1]);
      if (semNo >= 1 && semNo <= 24) return toOrdinalYear(Math.ceil(semNo / 2));
    }
    const reverseSemMatch = raw.match(reverseSemesterPattern);
    if (reverseSemMatch) {
      const semNo = Number(reverseSemMatch[1]);
      if (semNo >= 1 && semNo <= 24) return toOrdinalYear(Math.ceil(semNo / 2));
    }

    const yearMatch = raw.match(yearPattern);
    if (yearMatch) return toOrdinalYear(Number(yearMatch[1]));

    for (const item of ordinals) {
      if (item.test.test(raw)) return toOrdinalYear(item.value);
    }

    return "";
  };


  return(
    <div className="page-shell">
      <Navbar/>

      <div className="page-content">
      <div className="container mt-4">
        <AdSlot className="mb-3" label="Sponsored" />

        <div className="home-section section-panel" style={{ background: sectionPanelBgColor || "#ffffff" }}>
          <h3 style={titleTextStyle}>{title}</h3>

        <div className="cards-grid cards-grid-4-6 semesters-grid">

          {list.map(s=>(
            <div className="cards-grid-item" key={s._id}>

                <div
                  className="card modern-card semester-card h-100"
                  style={{
                    background: cardBg,
                    minHeight: cardStyle.minHeight ? `${cardStyle.minHeight}px` : undefined,
                    maxWidth: safeCardMaxWidth,
                    width: "100%"
                  }}
                >
                <div className="card-body">
                  <div className="semester-card-head">
                    {(() => {
                      const Tag = semesterNameStyle.variant || "h6";
                      return <Tag style={cardTextStyle}>{s.name}</Tag>;
                    })()}
                    {getYearLabel(s.name) && (
                      <span className="semester-year-chip" style={{ color: cardStyle.textColor || "#334155" }}>
                        {getYearLabel(s.name)}
                      </span>
                    )}
                  </div>

                  <Link
                    to={`/papers/${s._id}`}
                    className="btn btn-outline-primary btn-sm mt-2 semester-view-btn"
                    style={semesterBtnStyle}
                    onMouseEnter={e => {
                      if (buttonStyle.hoverColor) {
                        e.currentTarget.style.backgroundColor = buttonStyle.hoverColor;
                        e.currentTarget.style.borderColor = buttonStyle.hoverColor;
                      }
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.backgroundColor = buttonStyle.bgColor || "";
                      e.currentTarget.style.borderColor = buttonStyle.bgColor || "";
                    }}
                  >
                    View Papers
                  </Link>
                </div>

              </div>

            </div>
          ))}

        </div>
        </div>
        <AdSlot className="mt-3" label="Sponsored" />

      </div>
      </div>
      <div className="footer-top-gap" />
      <Footer />
    </div>
  );
}
