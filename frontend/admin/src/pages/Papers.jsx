import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Layout from "../components/Layout";
import { API_BASE, resolveApiUrl } from "../config/api";

const resolvePaperFileUrl = file => {
  if (!file) return "";
  if (/^https?:\/\//i.test(file)) return file;
  return resolveApiUrl(`/uploads/${file}`);
};

const getId = value => {
  if (!value) return "";
  if (typeof value === "object") return value._id || "";
  return value;
};

export default function Papers() {
  const [list, setList] = useState([]);
  const [universities, setUniversities] = useState([]);
  const [courses, setCourses] = useState([]);
  const [allSems, setAllSems] = useState([]);
  const [sems, setSems] = useState([]);

  const [editingId, setEditingId] = useState("");
  const [universityId, setUniversityId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [semId, setSemId] = useState("");
  const [title, setTitle] = useState("");
  const [year, setYear] = useState("");
  const [pdf, setPdf] = useState(null);

  const [filterQuery, setFilterQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterUniversityId, setFilterUniversityId] = useState("");
  const [filterCourseId, setFilterCourseId] = useState("");
  const [filterSemId, setFilterSemId] = useState("");

  const token = localStorage.getItem("token");

  const headers = {
    headers: {
      Authorization: token,
      "Content-Type": "multipart/form-data"
    }
  };

  const authHeaders = {
    headers: {
      Authorization: token
    }
  };

  const load = async () => {
    const [papersRes, universitiesRes, coursesRes, semestersRes] = await Promise.all([
      axios.get(`${API_BASE}/api/papers`),
      axios.get(`${API_BASE}/api/universities`),
      axios.get(`${API_BASE}/api/courses`),
      axios.get(`${API_BASE}/api/semesters`)
    ]);
    setList(Array.isArray(papersRes.data) ? papersRes.data : []);
    setUniversities(Array.isArray(universitiesRes.data) ? universitiesRes.data : []);
    setCourses(Array.isArray(coursesRes.data) ? coursesRes.data : []);
    setAllSems(Array.isArray(semestersRes.data) ? semestersRes.data : []);
  };

  useEffect(() => {
    load();
  }, []);

  const loadSem = async id => {
    if (!id) {
      setSems([]);
      return;
    }
    const res = await axios.get(`${API_BASE}/api/semesters/${id}`);
    setSems(Array.isArray(res.data) ? res.data : []);
  };

  const resetForm = () => {
    setEditingId("");
    setUniversityId("");
    setCourseId("");
    setSemId("");
    setTitle("");
    setYear("");
    setPdf(null);
    setSems([]);
  };

  const filteredCourses = useMemo(() => {
    if (!universityId) return [];
    return courses.filter(c => String(getId(c?.universityId)) === String(universityId));
  }, [courses, universityId]);

  const tableFilteredCourses = useMemo(() => {
    if (!filterUniversityId) return courses;
    return courses.filter(c => String(getId(c?.universityId)) === String(filterUniversityId));
  }, [courses, filterUniversityId]);

  const tableFilteredSems = useMemo(() => {
    if (!filterCourseId) return allSems;
    return allSems.filter(s => String(getId(s?.courseId)) === String(filterCourseId));
  }, [allSems, filterCourseId]);

  const categories = useMemo(() => {
    const values = new Set();
    list.forEach(item => {
      const value = String(item.category || "").trim();
      if (value) values.add(value);
    });
    return [...values].sort((a, b) => a.localeCompare(b));
  }, [list]);

  const filteredList = useMemo(() => {
    const q = String(filterQuery || "").trim().toLowerCase();
    return list.filter(item => {
      const rowCategory = String(item.category || "").trim();
      const rowUniversityId = getId(item.courseId?.universityId);
      const rowCourseId = getId(item.courseId);
      const rowSemId = getId(item.semId);

      const matchCategory = !filterCategory || rowCategory === filterCategory;
      const matchUniversity = !filterUniversityId || String(rowUniversityId) === String(filterUniversityId);
      const matchCourse = !filterCourseId || String(rowCourseId) === String(filterCourseId);
      const matchSem = !filterSemId || String(rowSemId) === String(filterSemId);
      const matchQuery =
        !q ||
        String(item.title || "").toLowerCase().includes(q) ||
        String(item.courseName || item.courseId?.name || "").toLowerCase().includes(q) ||
        String(item.semesterName || item.semId?.name || "").toLowerCase().includes(q) ||
        String(item.universityName || item.courseId?.universityId?.name || "").toLowerCase().includes(q);

      return matchCategory && matchUniversity && matchCourse && matchSem && matchQuery;
    });
  }, [list, filterCategory, filterUniversityId, filterCourseId, filterSemId, filterQuery]);

  const save = async () => {
    if (!courseId || !semId || !title.trim() || !year) {
      return alert("Fill all fields");
    }
    if (!editingId && !pdf) {
      return alert("PDF file is required");
    }

    const fd = new FormData();
    fd.append("courseId", courseId);
    fd.append("semId", semId);
    fd.append("title", title.trim());
    fd.append("year", year);
    if (pdf) fd.append("pdf", pdf);

    if (editingId) {
      await axios.put(`${API_BASE}/api/papers/${editingId}`, fd, headers);
    } else {
      await axios.post(`${API_BASE}/api/papers`, fd, headers);
    }

    resetForm();
    await load();
  };

  const startEdit = async paper => {
    const nextUniversityId = getId(paper?.courseId?.universityId);
    const nextCourseId = getId(paper?.courseId);
    const nextSemId = getId(paper?.semId);

    setEditingId(paper?._id || "");
    setUniversityId(String(nextUniversityId || ""));
    setCourseId(String(nextCourseId || ""));
    setSemId(String(nextSemId || ""));
    setTitle(String(paper?.title || ""));
    setYear(String(paper?.year || ""));
    setPdf(null);
    await loadSem(nextCourseId);
  };

  const del = async id => {
    if (!window.confirm("Delete this paper?")) return;
    await axios.delete(`${API_BASE}/api/papers/${id}`, authHeaders);
    await load();
  };

  return (
    <Layout>
      <div className="mb-3">
        <input
          type="number"
          placeholder="Year"
          className="form-control"
          value={year}
          onChange={e => setYear(e.target.value)}
        />
      </div>

      <div className="row mb-3">
        <div className="col-md-3">
          <select
            className="form-control"
            value={universityId}
            onChange={e => {
              setUniversityId(e.target.value);
              setCourseId("");
              setSemId("");
              setSems([]);
            }}
          >
            <option value="">Select University</option>
            {universities.map(u => (
              <option key={u._id} value={u._id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>

        <div className="col-md-3">
          <select
            className="form-control"
            value={courseId}
            onChange={e => {
              setCourseId(e.target.value);
              setSemId("");
              loadSem(e.target.value);
            }}
            disabled={!universityId}
          >
            <option value="">Select Course</option>
            {filteredCourses.map(c => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="col-md-2">
          <select className="form-control" value={semId} onChange={e => setSemId(e.target.value)}>
            <option value="">Select Semester</option>
            {sems.map(s => (
              <option key={s._id} value={s._id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div className="col-md-2">
          <input
            className="form-control"
            placeholder="Paper Title"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
        </div>

        <div className="col-md-2">
          <input type="file" className="form-control" accept="application/pdf" onChange={e => setPdf(e.target.files?.[0] || null)} />
        </div>
      </div>

      <div className="d-flex gap-2 mb-4">
        <button onClick={save} className="btn btn-primary">
          {editingId ? "Update Paper" : "Upload PDF"}
        </button>
        {editingId && (
          <button type="button" className="btn btn-outline-secondary" onClick={resetForm}>
            Cancel
          </button>
        )}
      </div>

      <div className="row mb-3 g-2">
        <div className="col-md-2">
          <select className="form-control" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
            <option value="">All Types</option>
            {categories.map(value => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>
        <div className="col-md-2">
          <select
            className="form-control"
            value={filterUniversityId}
            onChange={e => {
              setFilterUniversityId(e.target.value);
              setFilterCourseId("");
              setFilterSemId("");
            }}
          >
            <option value="">All Universities</option>
            {universities.map(u => (
              <option key={u._id} value={u._id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>
        <div className="col-md-2">
          <select
            className="form-control"
            value={filterCourseId}
            onChange={e => {
              setFilterCourseId(e.target.value);
              setFilterSemId("");
            }}
          >
            <option value="">All Courses</option>
            {tableFilteredCourses.map(c => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="col-md-2">
          <select className="form-control" value={filterSemId} onChange={e => setFilterSemId(e.target.value)}>
            <option value="">All Semesters</option>
            {tableFilteredSems.map(s => (
              <option key={s._id} value={s._id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div className="col-md-4">
          <input
            className="form-control"
            placeholder="Search title/course/semester/university..."
            value={filterQuery}
            onChange={e => setFilterQuery(e.target.value)}
          />
        </div>
      </div>

      <table className="table table-bordered shadow">
        <thead>
          <tr>
            <th>#</th>
            <th>Course Name</th>
            <th>University/Board</th>
            <th>Type</th>
            <th>Semester</th>
            <th>Paper Title</th>
            <th>Year</th>
            <th>File</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {filteredList.map((p, i) => (
            <tr key={p._id}>
              <td>{i + 1}</td>
              <td>{p.courseName || p.courseId?.name || "-"}</td>
              <td>{p.universityName || p.courseId?.universityId?.name || "-"}</td>
              <td>{p.category || "-"}</td>
              <td>{p.semesterName || p.semId?.name || "-"}</td>
              <td>{p.title}</td>
              <td>{p.year || "-"}</td>
              <td>
                <a href={resolvePaperFileUrl(p.file)} target="_blank" rel="noreferrer">
                  View
                </a>
              </td>
              <td>
                <div className="d-flex gap-2">
                  <button className="btn btn-sm btn-warning" onClick={() => startEdit(p)}>
                    Update
                  </button>
                  <button className="btn btn-sm btn-danger" onClick={() => del(p._id)}>
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {filteredList.length === 0 && (
            <tr>
              <td colSpan={9} className="text-center text-muted">
                No papers found for selected filters.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </Layout>
  );
}
