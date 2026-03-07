import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import Layout from "../components/Layout";

const API = import.meta.env.VITE_API_BASE || import.meta.env.REACT_APP_API_BASE || "http://localhost:5000";
const SECTION_TYPE_OPTIONS = [
  { value: "university", label: "University Section (Home Page)" },
  { value: "course", label: "Course Section (Courses Page)" },
  { value: "semester", label: "Semester Section (Semesters Page)" }
];
const defaultSectionTitleStyle = {
  color: "#0f172a",
  size: 32,
  align: "left",
  bold: false,
  italic: false,
  underline: false
};
const defaultSectionDescriptionStyle = {
  color: "#475569",
  size: 20,
  align: "left",
  bold: false,
  italic: false,
  underline: false
};

const normalizeTextStyle = (style, fallback) => ({
  ...fallback,
  ...(style || {})
});

const normalizeSection = section => ({
  ...section,
  sectionType: ["university", "course", "semester"].includes(String(section?.sectionType || "").toLowerCase())
    ? String(section.sectionType).toLowerCase()
    : "course",
  itemIds: Array.isArray(section?.itemIds)
    ? section.itemIds.map(id => String(id || "")).filter(Boolean)
    : Array.isArray(section?.courseIds)
      ? section.courseIds.map(id => String(id || "")).filter(Boolean)
      : [],
  titleStyle: normalizeTextStyle(section?.titleStyle, defaultSectionTitleStyle),
  descriptionStyle: normalizeTextStyle(section?.descriptionStyle, defaultSectionDescriptionStyle)
});

export default function CourseSections() {
  const [courseSections, setCourseSections] = useState([]);
  const [courses, setCourses] = useState([]);
  const [universities, setUniversities] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [activeSection, setActiveSection] = useState(0);
  const [newCourseName, setNewCourseName] = useState("");
  const [courseNameEdits, setCourseNameEdits] = useState({});
  const [universitiesSectionTitle, setUniversitiesSectionTitle] = useState("Universities / Colleges / Schools");
  const [universitiesSectionSubtitle, setUniversitiesSectionSubtitle] = useState("Select a card to view its courses");
  const [coursesSectionTitle, setCoursesSectionTitle] = useState("Courses");
  const [semestersSectionTitle, setSemestersSectionTitle] = useState("Semesters");
  const [questionPapersSectionTitle, setQuestionPapersSectionTitle] = useState("Question Papers");
  const [sectionCardButtonEnabled, setSectionCardButtonEnabled] = useState(true);
  const [sectionCardButtonText, setSectionCardButtonText] = useState("View Details");
  const [saving, setSaving] = useState(false);

  const token = localStorage.getItem("token");
  const headers = { headers: { Authorization: token } };

  const loadCourses = useCallback(() => {
    axios.get(`${API}/api/courses`).then(res => {
      const list = res.data || [];
      setCourses(list);
      setCourseNameEdits(prev => {
        const next = { ...prev };
        list.forEach(c => {
          if (next[c._id] === undefined) next[c._id] = c.name;
        });
        return next;
      });
    });
  }, []);

  const loadUniversities = useCallback(() => {
    axios.get(`${API}/api/universities`).then(res => {
      setUniversities(Array.isArray(res.data) ? res.data : []);
    });
  }, []);

  const loadSemesters = useCallback(() => {
    axios.get(`${API}/api/semesters`).then(res => {
      setSemesters(Array.isArray(res.data) ? res.data : []);
    });
  }, []);

  const loadSections = useCallback(() => {
    axios.get(`${API}/api/settings`).then(res => {
      setCourseSections(
        Array.isArray(res.data.courseSections)
          ? res.data.courseSections.map(normalizeSection)
          : []
      );
      setActiveSection(0);
      setUniversitiesSectionTitle(res.data.universitiesSectionTitle || "Universities / Colleges / Schools");
      setUniversitiesSectionSubtitle(res.data.universitiesSectionSubtitle || "Select a card to view its courses");
      setCoursesSectionTitle(res.data.coursesSectionTitle || "Courses");
      setSemestersSectionTitle(res.data.semestersSectionTitle || "Semesters");
      setQuestionPapersSectionTitle(res.data.questionPapersSectionTitle || "Question Papers");
      setSectionCardButtonEnabled(
        typeof res.data.sectionCardButtonEnabled === "boolean"
          ? res.data.sectionCardButtonEnabled
          : true
      );
      setSectionCardButtonText(res.data.sectionCardButtonText || "View Details");
    });
  }, []);

  useEffect(() => {
    loadCourses();
    loadUniversities();
    loadSemesters();
    loadSections();
  }, [loadCourses, loadSections, loadSemesters, loadUniversities]);

  const save = async () => {
    setSaving(true);
    try {
      await axios.put(
        `${API}/api/settings`,
        {
          courseSections,
          universitiesSectionTitle,
          universitiesSectionSubtitle,
          coursesSectionTitle,
          semestersSectionTitle,
          questionPapersSectionTitle,
          sectionCardButtonEnabled,
          sectionCardButtonText
        },
        headers
      );
      alert("Course sections saved");
    } catch (err) {
      const msg = err?.response?.data || err?.message || "Save failed";
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  const addSection = () => {
    const next = [
      ...courseSections,
      normalizeSection({
        title: "New Section",
        description: "",
        sectionType: "course",
        itemIds: [],
        active: true,
        comingSoon: false,
        comingSoonText: "Coming soon"
      })
    ];
    setCourseSections(next);
    setActiveSection(next.length - 1);
  };

  const updateSection = (idx, key, value) => {
    const next = courseSections.map((s, i) =>
      i === idx ? { ...s, [key]: value } : s
    );
    setCourseSections(next);
  };

  const updateSectionStyle = (idx, key, styleKey, value) => {
    const section = courseSections[idx];
    const fallback =
      key === "titleStyle" ? defaultSectionTitleStyle : defaultSectionDescriptionStyle;
    const current = normalizeTextStyle(section?.[key], fallback);
    updateSection(idx, key, { ...current, [styleKey]: value });
  };

  const toggleCourseInSection = (idx, itemId) => {
    const safeId = String(itemId || "");
    if (!safeId) return;
    setCourseSections(prev => {
      const current = prev[idx] || {};
      const type = String(current.sectionType || "course").toLowerCase();
      const currentIds = new Set((current.itemIds || []).map(id => String(id || "")));
      const isRemoving = currentIds.has(safeId);

      return prev.map((section, sectionIdx) => {
        const sectionType = String(section?.sectionType || "course").toLowerCase();
        const ids = new Set((section?.itemIds || []).map(id => String(id || "")));
        if (sectionIdx === idx) {
          if (isRemoving) ids.delete(safeId);
          else ids.add(safeId);
          return { ...section, itemIds: Array.from(ids) };
        }
        // Enforce unique assignment inside same type sections.
        if (!isRemoving && sectionType === type && ids.has(safeId)) {
          ids.delete(safeId);
          return { ...section, itemIds: Array.from(ids) };
        }
        return section;
      });
    });
  };

  const removeSection = idx => {
    const next = courseSections.filter((_, i) => i !== idx);
    setCourseSections(next);
    setActiveSection(Math.max(0, Math.min(activeSection, next.length - 1)));
  };

  const addCourse = async () => {
    if (!newCourseName.trim()) return alert("Enter course name");
    try {
      await axios.post(
        `${API}/api/courses`,
        { name: newCourseName.trim() },
        headers
      );
      setNewCourseName("");
      loadCourses();
    } catch (err) {
      alert("Add course failed");
    }
  };

  const updateCourse = async courseId => {
    const name = (courseNameEdits[courseId] || "").trim();
    if (!name) return alert("Enter course name");
    try {
      await axios.put(
        `${API}/api/courses/${courseId}`,
        { name },
        headers
      );
      loadCourses();
    } catch (err) {
      alert("Update course failed");
    }
  };

  const deleteCourse = async courseId => {
    if (!window.confirm("Delete course?")) return;
    try {
      await axios.delete(`${API}/api/courses/${courseId}`, headers);
      const next = courseSections.map(s => ({
        ...s,
        itemIds: (s.itemIds || []).filter(id => id !== courseId)
      }));
      setCourseSections(next);
      loadCourses();
    } catch (err) {
      alert("Delete course failed");
    }
  };

  const selectedSection = courseSections[activeSection];
  const selectedSectionType = selectedSection?.sectionType || "course";
  const assignedIdsByType = courseSections.reduce(
    (acc, section) => {
      const type = String(section?.sectionType || "course").toLowerCase();
      if (!acc[type]) return acc;
      (section?.itemIds || []).forEach(id => {
        const safeId = String(id || "");
        if (safeId) acc[type].add(safeId);
      });
      return acc;
    },
    { university: new Set(), course: new Set(), semester: new Set() }
  );
  const unassignedByType = {
    university: universities.filter(item => !assignedIdsByType.university.has(String(item?._id || ""))),
    course: courses.filter(item => !assignedIdsByType.course.has(String(item?._id || ""))),
    semester: semesters.filter(item => !assignedIdsByType.semester.has(String(item?._id || "")))
  };
  const selectedItems = (() => {
    if (!selectedSection) return [];
    if (selectedSectionType === "university") return universities;
    if (selectedSectionType === "semester") return semesters;
    return courses;
  })();

  const getItemId = item => String(item?._id || "");
  const isAssignedElsewhere = id => {
    const safeId = String(id || "");
    if (!safeId || !selectedSection) return false;
    const type = String(selectedSection.sectionType || "course").toLowerCase();
    return courseSections.some((section, idx) => {
      if (idx === activeSection) return false;
      if (String(section?.sectionType || "course").toLowerCase() !== type) return false;
      return (section?.itemIds || []).includes(safeId);
    });
  };
  const getItemLabel = item => {
    if (selectedSectionType === "university") {
      const type = String(item?.type || "").trim();
      return type ? `${item?.name || "University"} (${type})` : item?.name || "University";
    }
    if (selectedSectionType === "semester") {
      const semName = item?.name || "Semester";
      const courseName = item?.courseName || item?.courseId?.name || "";
      const uniName = item?.universityName || item?.courseId?.universityId?.name || "";
      return [semName, courseName, uniName].filter(Boolean).join(" | ");
    }
    return item?.name || "Course";
  };

  return (
    <Layout>

      <div className="card p-4 shadow" style={{ maxWidth: "900px" }}>
        <div className="border rounded p-3 mb-3">
          <div className="fw-bold mb-2">Universities Section</div>
          <div className="mb-3">
            <label className="form-label">Section Title</label>
            <input
              className="form-control"
              value={universitiesSectionTitle}
              onChange={e => setUniversitiesSectionTitle(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Section Subtitle</label>
            <input
              className="form-control"
              value={universitiesSectionSubtitle}
              onChange={e => setUniversitiesSectionSubtitle(e.target.value)}
            />
          </div>
          <div className="mb-0">
            <label className="form-label">Courses Title</label>
            <input
              className="form-control"
              value={coursesSectionTitle}
              onChange={e => setCoursesSectionTitle(e.target.value)}
            />
          </div>
          <div className="mb-0 mt-3">
            <label className="form-label">Semesters Title</label>
            <input
              className="form-control"
              value={semestersSectionTitle}
              onChange={e => setSemestersSectionTitle(e.target.value)}
            />
          </div>
          <div className="mb-0 mt-3">
            <label className="form-label">Question Papers Title</label>
            <input
              className="form-control"
              value={questionPapersSectionTitle}
              onChange={e => setQuestionPapersSectionTitle(e.target.value)}
            />
          </div>
          <div className="mt-3 d-flex gap-3 align-items-center">
            <div className="form-check">
              <input
                className="form-check-input"
                type="checkbox"
                id="section-card-button-enabled"
                checked={sectionCardButtonEnabled}
                onChange={e => setSectionCardButtonEnabled(e.target.checked)}
              />
              <label className="form-check-label" htmlFor="section-card-button-enabled">
                Show button on section cards
              </label>
            </div>
            <div style={{ minWidth: "260px", flex: 1 }}>
              <input
                className="form-control"
                placeholder="Button text"
                value={sectionCardButtonText}
                onChange={e => setSectionCardButtonText(e.target.value)}
                disabled={!sectionCardButtonEnabled}
              />
            </div>
          </div>
        </div>

        <div className="d-flex justify-content-between align-items-center mb-3">
          <div className="fw-bold">Manage Sections</div>
          <button className="btn btn-sm btn-outline-primary" onClick={addSection}>
            Add Section
          </button>
        </div>

        {courseSections.length > 0 && (
          <div className="mb-3">
            <label className="form-label">Select Section</label>
            <select
              className="form-select"
              value={activeSection}
              onChange={e => setActiveSection(Number(e.target.value))}
            >
              {courseSections.map((s, i) => (
                <option key={`sec-${i}`} value={i}>
                  {s.title ? s.title : `Section ${i + 1}`}
                </option>
              ))}
            </select>
          </div>
        )}

        {courseSections.length === 0 && (
          <div className="text-muted">No sections added.</div>
        )}

        {selectedSection && (
          <div className="border rounded p-3 mb-3">
            <div className="d-flex justify-content-between align-items-center">
              <div className="fw-bold">Editing Section</div>
              <button className="btn btn-sm btn-outline-danger" onClick={() => removeSection(activeSection)}>
                Remove Section
              </button>
            </div>

            <div className="mt-2">
              <label className="form-label">Title</label>
              <input
                className="form-control"
                value={selectedSection.title || ""}
                onChange={e => updateSection(activeSection, "title", e.target.value)}
              />
            </div>

            <div className="mt-2">
              <label className="form-label">Description</label>
              <input
                className="form-control"
                value={selectedSection.description || ""}
                onChange={e => updateSection(activeSection, "description", e.target.value)}
              />
            </div>

            <div className="mt-2">
              <label className="form-label">Section Type</label>
              <select
                className="form-select"
                value={selectedSection.sectionType || "course"}
                onChange={e => {
                  const nextType = String(e.target.value || "course");
                  setCourseSections(prev => {
                    const target = prev[activeSection];
                    if (!target) return prev;
                    const currentIds = Array.isArray(target.itemIds) ? target.itemIds : [];
                    const allowedIds = new Set(
                      (nextType === "university" ? universities : nextType === "semester" ? semesters : courses)
                        .map(item => String(item?._id || ""))
                        .filter(Boolean)
                    );
                    return prev.map((section, idx) =>
                      idx === activeSection
                        ? {
                            ...section,
                            sectionType: nextType,
                            itemIds: currentIds
                              .map(id => String(id || ""))
                              .filter(id => allowedIds.has(id))
                          }
                        : section
                    );
                  });
                }}
              >
                {SECTION_TYPE_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <div className="form-text">
                Section same type ke page par show hoga.
              </div>
              <div className="mt-2 d-flex gap-2 flex-wrap">
                <span className="badge text-bg-secondary">
                  Unassigned Universities: {unassignedByType.university.length}
                </span>
                <span className="badge text-bg-secondary">
                  Unassigned Courses: {unassignedByType.course.length}
                </span>
                <span className="badge text-bg-secondary">
                  Unassigned Semesters: {unassignedByType.semester.length}
                </span>
              </div>
            </div>

            <div className="mt-3 border rounded p-3">
              <div className="fw-semibold mb-2">Section Title Style</div>
              <div className="row">
                <div className="col-md-3 mb-2">
                  <label className="form-label">Text Color</label>
                  <input
                    type="color"
                    className="form-control form-control-color"
                    value={selectedSection.titleStyle?.color || defaultSectionTitleStyle.color}
                    onChange={e => updateSectionStyle(activeSection, "titleStyle", "color", e.target.value)}
                  />
                </div>
                <div className="col-md-3 mb-2">
                  <label className="form-label">Text Size (px)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={selectedSection.titleStyle?.size || defaultSectionTitleStyle.size}
                    onChange={e => updateSectionStyle(activeSection, "titleStyle", "size", Number(e.target.value || 0))}
                  />
                </div>
                <div className="col-md-3 mb-2">
                  <label className="form-label">Align</label>
                  <select
                    className="form-select"
                    value={selectedSection.titleStyle?.align || defaultSectionTitleStyle.align}
                    onChange={e => updateSectionStyle(activeSection, "titleStyle", "align", e.target.value)}
                  >
                    <option value="left">left</option>
                    <option value="center">center</option>
                    <option value="right">right</option>
                  </select>
                </div>
                <div className="col-md-3 mb-2 d-flex align-items-end">
                  <div className="form-check me-3">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id={`sec-title-bold-${activeSection}`}
                      checked={!!selectedSection.titleStyle?.bold}
                      onChange={e => updateSectionStyle(activeSection, "titleStyle", "bold", e.target.checked)}
                    />
                    <label className="form-check-label" htmlFor={`sec-title-bold-${activeSection}`}>Bold</label>
                  </div>
                  <div className="form-check me-3">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id={`sec-title-italic-${activeSection}`}
                      checked={!!selectedSection.titleStyle?.italic}
                      onChange={e => updateSectionStyle(activeSection, "titleStyle", "italic", e.target.checked)}
                    />
                    <label className="form-check-label" htmlFor={`sec-title-italic-${activeSection}`}>Italic</label>
                  </div>
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id={`sec-title-underline-${activeSection}`}
                      checked={!!selectedSection.titleStyle?.underline}
                      onChange={e => updateSectionStyle(activeSection, "titleStyle", "underline", e.target.checked)}
                    />
                    <label className="form-check-label" htmlFor={`sec-title-underline-${activeSection}`}>Underline</label>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-3 border rounded p-3">
              <div className="fw-semibold mb-2">Section Description Style</div>
              <div className="row">
                <div className="col-md-3 mb-2">
                  <label className="form-label">Text Color</label>
                  <input
                    type="color"
                    className="form-control form-control-color"
                    value={selectedSection.descriptionStyle?.color || defaultSectionDescriptionStyle.color}
                    onChange={e => updateSectionStyle(activeSection, "descriptionStyle", "color", e.target.value)}
                  />
                </div>
                <div className="col-md-3 mb-2">
                  <label className="form-label">Text Size (px)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={selectedSection.descriptionStyle?.size || defaultSectionDescriptionStyle.size}
                    onChange={e => updateSectionStyle(activeSection, "descriptionStyle", "size", Number(e.target.value || 0))}
                  />
                </div>
                <div className="col-md-3 mb-2">
                  <label className="form-label">Align</label>
                  <select
                    className="form-select"
                    value={selectedSection.descriptionStyle?.align || defaultSectionDescriptionStyle.align}
                    onChange={e => updateSectionStyle(activeSection, "descriptionStyle", "align", e.target.value)}
                  >
                    <option value="left">left</option>
                    <option value="center">center</option>
                    <option value="right">right</option>
                  </select>
                </div>
                <div className="col-md-3 mb-2 d-flex align-items-end">
                  <div className="form-check me-3">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id={`sec-desc-bold-${activeSection}`}
                      checked={!!selectedSection.descriptionStyle?.bold}
                      onChange={e => updateSectionStyle(activeSection, "descriptionStyle", "bold", e.target.checked)}
                    />
                    <label className="form-check-label" htmlFor={`sec-desc-bold-${activeSection}`}>Bold</label>
                  </div>
                  <div className="form-check me-3">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id={`sec-desc-italic-${activeSection}`}
                      checked={!!selectedSection.descriptionStyle?.italic}
                      onChange={e => updateSectionStyle(activeSection, "descriptionStyle", "italic", e.target.checked)}
                    />
                    <label className="form-check-label" htmlFor={`sec-desc-italic-${activeSection}`}>Italic</label>
                  </div>
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id={`sec-desc-underline-${activeSection}`}
                      checked={!!selectedSection.descriptionStyle?.underline}
                      onChange={e => updateSectionStyle(activeSection, "descriptionStyle", "underline", e.target.checked)}
                    />
                    <label className="form-check-label" htmlFor={`sec-desc-underline-${activeSection}`}>Underline</label>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-3 d-flex gap-3">
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id={`section-${activeSection}-active`}
                  checked={selectedSection.active !== false}
                  onChange={e => updateSection(activeSection, "active", e.target.checked)}
                />
                <label className="form-check-label" htmlFor={`section-${activeSection}-active`}>Active</label>
              </div>
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id={`section-${activeSection}-coming-soon`}
                  checked={!!selectedSection.comingSoon}
                  onChange={e => updateSection(activeSection, "comingSoon", e.target.checked)}
                />
                <label className="form-check-label" htmlFor={`section-${activeSection}-coming-soon`}>Coming Soon</label>
              </div>
            </div>

            <div className="mt-2">
              <label className="form-label">Coming Soon Text</label>
              <input
                className="form-control"
                value={selectedSection.comingSoonText || "Coming soon"}
                onChange={e => updateSection(activeSection, "comingSoonText", e.target.value)}
              />
            </div>

            {selectedSectionType === "course" && (
              <div className="mt-3">
                <label className="form-label">Add New Course</label>
                <div className="d-flex gap-2">
                  <input
                    className="form-control"
                    value={newCourseName}
                    onChange={e => setNewCourseName(e.target.value)}
                    placeholder="Course name"
                  />
                  <button className="btn btn-outline-primary" onClick={addCourse}>
                    Add
                  </button>
                </div>
                <div className="form-text">Course will be added globally, then you can select it.</div>
              </div>
            )}

            <div className="mt-3">
              <label className="form-label">
                {selectedSectionType === "university"
                  ? "Select Universities for This Section"
                  : selectedSectionType === "semester"
                    ? "Select Semesters for This Section"
                    : "Select Courses for This Section"}
              </label>
              <div className="row">
                {selectedItems.map(item => (
                  <div key={getItemId(item)} className="col-md-6">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id={`section-${activeSection}-item-${getItemId(item)}`}
                        checked={(selectedSection.itemIds || []).includes(getItemId(item))}
                        disabled={isAssignedElsewhere(getItemId(item))}
                        onChange={() => toggleCourseInSection(activeSection, getItemId(item))}
                      />
                      <label className="form-check-label" htmlFor={`section-${activeSection}-item-${getItemId(item)}`}>
                        {getItemLabel(item)}{isAssignedElsewhere(getItemId(item)) ? " (Already in another section)" : ""}
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {selectedSectionType === "course" && (selectedSection.itemIds || []).length > 0 && (
              <div className="mt-3">
                <label className="form-label">Edit or Remove Courses in This Section</label>
                <div className="row">
                  {(selectedSection.itemIds || []).map(id => {
                    const course = courses.find(c => c._id === id);
                    if (!course) return null;
                    return (
                      <div key={id} className="col-md-6 mb-2">
                        <div className="border rounded p-2">
                          <input
                            className="form-control mb-2"
                            value={courseNameEdits[id] || course.name}
                            onChange={e => setCourseNameEdits({ ...courseNameEdits, [id]: e.target.value })}
                          />
                          <div className="d-flex gap-2">
                            <button className="btn btn-sm btn-outline-success" onClick={() => updateCourse(id)}>
                              Update
                            </button>
                            <button className="btn btn-sm btn-outline-secondary" onClick={() => toggleCourseInSection(activeSection, id)}>
                              Remove From Section
                            </button>
                            <button className="btn btn-sm btn-outline-danger" onClick={() => deleteCourse(id)}>
                              Delete Course
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        <button className="btn btn-primary" onClick={save} disabled={saving}>
          {saving ? "Saving..." : "Save Sections"}
        </button>
      </div>
    </Layout>
  );
}

