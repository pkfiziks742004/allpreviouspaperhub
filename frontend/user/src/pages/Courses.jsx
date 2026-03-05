import axios from "axios";
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { API_BASE } from "../config/api";
import { toRouteSegment } from "../utils/slugs";

export default function Courses(){
  const { universitySlug } = useParams();

  const [courses,setCourses]=useState([]);
  const [search,setSearch]=useState("");
  const [coursesSectionTitle, setCoursesSectionTitle] = useState("");
  const [coursesTitleStyle, setCoursesTitleStyle] = useState({});
  const [cardStyles, setCardStyles] = useState({});
  const [courseNameStyle, setCourseNameStyle] = useState({});
  const [courseButtonStyle, setCourseButtonStyle] = useState({});
  const [sectionPanelBgColor, setSectionPanelBgColor] = useState("#ffffff");
  const [typeActionLabels, setTypeActionLabels] = useState({
    university: "View Semesters",
    college: "View Semesters",
    school: "View Classes",
    entranceExam: "View Exam Papers",
    other: "View Details"
  });
  const [universities, setUniversities] = useState([]);
  const [selectedUniversity, setSelectedUniversity] = useState(null);
  const trackedSearchRef = useRef("");


  useEffect(()=>{

    axios.get(`${API_BASE}/api/courses`)
    .then(res=>setCourses(res.data));

    axios.get(`${API_BASE}/api/universities`)
    .then(res => setUniversities(res.data || []));

  },[]);

  useEffect(() => {
    if (!universitySlug || !universities.length) {
      setSelectedUniversity(null);
      return;
    }
    const found = universities.find(u => toRouteSegment(u.name, "university") === universitySlug) || null;
    setSelectedUniversity(found);
  }, [universitySlug, universities]);

  useEffect(() => {
    axios.get(`${API_BASE}/api/settings`).then(res => {
      setCoursesSectionTitle(res.data.coursesSectionTitle || "");
      setCoursesTitleStyle(res.data.coursesTitleStyle || {});
      setCardStyles(res.data.cardStyles || {});
      setCourseNameStyle(res.data.courseNameStyle || {});
      setCourseButtonStyle(res.data.courseButtonStyle || {});
      setSectionPanelBgColor(res.data.sectionPanelBgColor || "#ffffff");
      setTypeActionLabels({
        university: "View Semesters",
        college: "View Semesters",
        school: "View Classes",
        entranceExam: "View Exam Papers",
        other: "View Details",
        ...(res.data.typeActionLabels || {})
      });
    });
  }, []);

  useEffect(() => {
    const term = search.trim();
    if (term.length < 2) return;
    if (trackedSearchRef.current.toLowerCase() === term.toLowerCase()) return;

    const timer = setTimeout(() => {
      axios.post(`${API_BASE}/api/signals/search`, { term, source: "courses" }).catch(() => {});
      trackedSearchRef.current = term;
    }, 700);

    return () => clearTimeout(timer);
  }, [search]);

  const buildCardStyle = () => {
    const style = (cardStyles && cardStyles.course) || {};
    const hasGradient = style.gradientStart && style.gradientEnd;
    const background = hasGradient
      ? `linear-gradient(135deg, ${style.gradientStart}, ${style.gradientEnd})`
      : style.bgColor || undefined;
    return {
      background,
      color: style.textColor || undefined,
      minHeight: style.minHeight ? `${style.minHeight}px` : undefined,
      maxWidth: style.maxWidth ? `${style.maxWidth}px` : undefined
    };
  };

  const buildTextStyle = () => {
    const style = (cardStyles && cardStyles.course) || {};
    return {
      color: style.textColor || undefined,
      fontWeight: style.bold ? "700" : "normal",
      fontStyle: style.italic ? "italic" : "normal"
    };
  };

  const renderCourseName = name => {
    const Tag = courseNameStyle.variant || "h5";
    return (
      <Tag
        className={Tag === "h5" ? "card-title" : ""}
        style={{
          ...buildTextStyle(),
          color: courseNameStyle.color || buildTextStyle().color,
          fontWeight: courseNameStyle.bold ? "700" : (buildTextStyle().fontWeight || "normal"),
          fontStyle: courseNameStyle.italic ? "italic" : (buildTextStyle().fontStyle || "normal"),
          textAlign: courseNameStyle.align || "center",
          fontSize: courseNameStyle.size ? `${courseNameStyle.size}px` : undefined,
          width: "100%"
        }}
      >
        {name}
      </Tag>
    );
  };

  const sectionTitleStyle = {
    color: coursesTitleStyle.color || undefined,
    fontWeight: coursesTitleStyle.bold ? "700" : "normal",
    fontStyle: coursesTitleStyle.italic ? "italic" : "normal",
    textAlign: coursesTitleStyle.align || undefined,
    fontSize: coursesTitleStyle.size ? `${coursesTitleStyle.size}px` : undefined
  };

  const courseBtnStyle = {
    backgroundColor: courseButtonStyle.bgColor || undefined,
    color: courseButtonStyle.textColor || undefined,
    minWidth: courseButtonStyle.minWidth ? `${courseButtonStyle.minWidth}px` : undefined,
    fontSize: courseButtonStyle.size ? `${courseButtonStyle.size}px` : undefined,
    fontWeight: courseButtonStyle.bold ? "700" : "normal",
    fontStyle: courseButtonStyle.italic ? "italic" : "normal",
    borderColor: courseButtonStyle.bgColor || undefined
  };

  const getTypeKey = type => {
    const t = String(type || "").toLowerCase();
    if (t.includes("entrance")) return "entranceExam";
    if (t.includes("school")) return "school";
    if (t.includes("college")) return "college";
    if (t.includes("university")) return "university";
    return "other";
  };

  const getCourseButtonLabel = course => {
    if (course && course.buttonLabel && String(course.buttonLabel).trim()) {
      return course.buttonLabel;
    }
    const uni = universities.find(u => String(u._id) === String(course.universityId));
    const key = getTypeKey(uni && uni.type);
    return (typeActionLabels && typeActionLabels[key]) || "View Semesters";
  };

  const buildCoursePath = course => {
    const uni = selectedUniversity || universities.find(u => String(u._id) === String(course.universityId));
    if (!uni) return `/course/${course._id}`;
    return `/${toRouteSegment(uni.name, "university")}/${toRouteSegment(course.name, "course")}`;
  };

  const visibleCourses = courses
    .filter(c => !selectedUniversity || String(c.universityId || "") === String(selectedUniversity._id || ""))
    .filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  return(
    <div className="page-shell">
      <Navbar/>

      <div className="page-content">
      <div className="container mt-4">

        <div className="home-section section-panel" style={{ background: sectionPanelBgColor || "#ffffff" }}>
          <h3 className="section-title-sm" style={sectionTitleStyle}>
            {selectedUniversity ? `${selectedUniversity.name} - ${coursesSectionTitle || "Courses"}` : coursesSectionTitle}
          </h3>
        <input
  type="text"
  className="form-control mb-3"
  placeholder="Search course..."
  value={search}
  onChange={(e)=>setSearch(e.target.value)}
/>


        <div className="cards-grid cards-grid-4-6">

  {visibleCourses.map(c => (


    <div key={c._id} className="cards-grid-item">

      <div className="card modern-card h-100 text-center" style={buildCardStyle()}>

        <div className="card-body">

          {renderCourseName(c.name)}

          <a
            href={buildCoursePath(c)}
            className="btn btn-outline-primary btn-sm mt-3"
            style={courseBtnStyle}
            onMouseEnter={e => {
              if (courseButtonStyle.hoverColor) {
                e.currentTarget.style.backgroundColor = courseButtonStyle.hoverColor;
                e.currentTarget.style.borderColor = courseButtonStyle.hoverColor;
              }
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = courseButtonStyle.bgColor || "";
              e.currentTarget.style.borderColor = courseButtonStyle.bgColor || "";
            }}
          >
            {getCourseButtonLabel(c)}
          </a>

        </div>

      </div>

    </div>

  ))}

</div>
        </div>


      </div>
      </div>
      <div className="footer-top-gap" />
      <Footer />
    </div>
  );
}
