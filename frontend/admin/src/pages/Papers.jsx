import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Layout from "../components/Layout";
import { API_BASE, resolveApiUrl } from "../config/api";

const resolvePaperFileUrl = file => {
  if (!file) return "";
  if (/^https?:\/\//i.test(file)) return file;
  return resolveApiUrl(`/uploads/${file}`);
};

export default function Papers() {
  const [list, setList] = useState([]);
  const [universities, setUniversities] = useState([]);
  const [courses, setCourses] = useState([]);
  const [sems, setSems] = useState([]);

  const [universityId, setUniversityId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [semId, setSemId] = useState("");
  const [title, setTitle] = useState("");
  const [year, setYear] = useState("");
  const [pdf, setPdf] = useState(null);

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

  const load = () => {
    axios.get(`${API_BASE}/api/papers`).then(res => setList(res.data));
    axios.get(`${API_BASE}/api/universities`).then(res => setUniversities(res.data || []));
    axios.get(`${API_BASE}/api/courses`).then(res => setCourses(res.data));
  };

  useEffect(() => {
    load();
  }, []);

  const loadSem = id => {
    axios.get(`${API_BASE}/api/semesters/${id}`).then(res => setSems(res.data));
  };

  const filteredCourses = useMemo(() => {
    if (!universityId) return [];
    return courses.filter(c => {
      const id = c?.universityId?._id || c?.universityId || "";
      return String(id) === String(universityId);
    });
  }, [courses, universityId]);

  const add = async () => {
    if (!courseId || !semId || !title || !year || !pdf) {
      return alert("Fill all fields");
    }

    const fd = new FormData();
    fd.append("courseId", courseId);
    fd.append("semId", semId);
    fd.append("title", title);
    fd.append("year", year);
    fd.append("pdf", pdf);

    await axios.post(`${API_BASE}/api/papers`, fd, headers);

    setTitle("");
    setPdf(null);
    load();
  };

  const del = async id => {
    if (!window.confirm("Delete this paper?")) return;
    await axios.delete(`${API_BASE}/api/papers/${id}`, authHeaders);
    load();
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
          <input type="file" className="form-control" onChange={e => setPdf(e.target.files[0])} />
        </div>
      </div>

      <button onClick={add} className="btn btn-primary mb-4">
        Upload PDF
      </button>

      <table className="table table-bordered shadow">
        <thead>
          <tr>
            <th>#</th>
            <th>Title</th>
            <th>Course</th>
            <th>Semester</th>
            <th>File</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {list.map((p, i) => (
            <tr key={p._id}>
              <td>{i + 1}</td>
              <td>{p.title}</td>
              <td>{p.courseId?.name}</td>
              <td>{p.semId?.name}</td>
              <td>
                <a href={resolvePaperFileUrl(p.file)} target="_blank" rel="noreferrer">
                  View
                </a>
              </td>
              <td>
                <button className="btn btn-sm btn-danger" onClick={() => del(p._id)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Layout>
  );
}
