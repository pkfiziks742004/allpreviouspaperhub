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

  const getYearLabel = semesterName => {
    const raw = String(semesterName || "").toLowerCase().trim();
    const numMatch = raw.match(/\d+/);
    if (numMatch) {
      const semNo = Number(numMatch[0]);
      if (semNo > 0) {
        const yearNo = Math.ceil(semNo / 2);
        const suffix =
          yearNo % 10 === 1 && yearNo % 100 !== 11
            ? "st"
            : yearNo % 10 === 2 && yearNo % 100 !== 12
              ? "nd"
              : yearNo % 10 === 3 && yearNo % 100 !== 13
                ? "rd"
                : "th";
        return `${yearNo}${suffix} Year`;
      }
    }

    if (raw.includes("first") || raw.includes("1st")) return "1st Year";
    if (raw.includes("second") || raw.includes("2nd")) return "2nd Year";
    if (raw.includes("third") || raw.includes("3rd")) return "3rd Year";
    if (raw.includes("fourth") || raw.includes("4th")) return "4th Year";

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

        <div className="cards-grid cards-grid-4-6">

          {list.map(s=>(
            <div className="cards-grid-item" key={s._id}>

              <div
                className="card modern-card h-100 text-center p-3"
                style={{
                  background: cardBg,
                  minHeight: cardStyle.minHeight ? `${cardStyle.minHeight}px` : undefined,
                  maxWidth: cardStyle.maxWidth ? `${cardStyle.maxWidth}px` : undefined
                }}
              >

                {(() => {
                  const Tag = semesterNameStyle.variant || "h6";
                  return <Tag style={cardTextStyle}>{s.name}</Tag>;
                })()}
                {getYearLabel(s.name) && (
                  <div
                    style={{
                      marginTop: "4px",
                      color: cardStyle.textColor || "#64748b",
                      fontSize: "13px",
                      textAlign: semesterNameStyle.align || "center"
                    }}
                  >
                    {getYearLabel(s.name)}
                  </div>
                )}

                <Link
                  to={`/papers/${s._id}`}
                  className="btn btn-outline-primary btn-sm mt-2"
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
