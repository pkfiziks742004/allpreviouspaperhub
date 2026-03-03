import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Layout from "../components/Layout";
const API = import.meta.env.VITE_API_BASE || import.meta.env.REACT_APP_API_BASE || "http://localhost:5000";

export default function Semesters(){

  const [list,setList] = useState([]);
  const [universities,setUniversities] = useState([]);
  const [courses,setCourses] = useState([]);

  const [name,setName] = useState("");
  const [universityId,setUniversityId] = useState("");
  const [courseId,setCourseId] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterUniversityId, setFilterUniversityId] = useState("");
  const [filterCourseId, setFilterCourseId] = useState("");
  const [filterQuery, setFilterQuery] = useState("");

  const token = localStorage.getItem("token");

  const headers = {
    headers:{
      Authorization: token
    }
  };


  const load = ()=>{

    axios
      .get(`${API}/api/semesters`)
      .then(res=>setList(res.data));

    axios
      .get(`${API}/api/universities`)
      .then(res=>setUniversities(res.data || []));

    axios
      .get(`${API}/api/courses`)
      .then(res=>setCourses(res.data));
  };


  useEffect(()=>{
    load();
  },[]);

  const filteredCourses = useMemo(() => {
    if (!universityId) return [];
    return courses.filter(c => {
      const id = c?.universityId?._id || c?.universityId || "";
      return String(id) === String(universityId);
    });
  }, [courses, universityId]);

  const courseMap = useMemo(() => {
    const map = new Map();
    courses.forEach(c => map.set(String(c._id), c));
    return map;
  }, [courses]);

  const universityMap = useMemo(() => {
    const map = new Map();
    universities.forEach(u => map.set(String(u._id), u));
    return map;
  }, [universities]);

  const allTypes = useMemo(() => {
    const values = new Set();
    list.forEach(item => {
      const type = String(item?.courseType || "").trim();
      if (type) values.add(type);
    });
    return [...values].sort((a, b) => a.localeCompare(b));
  }, [list]);

  const tableFilteredCourses = useMemo(() => {
    if (!filterUniversityId) return courses;
    return courses.filter(c => {
      const id = c?.universityId?._id || c?.universityId || "";
      return String(id) === String(filterUniversityId);
    });
  }, [courses, filterUniversityId]);

  const filteredList = useMemo(() => {
    const q = String(filterQuery || "").trim().toLowerCase();
    const collator = new Intl.Collator("en", { sensitivity: "base", numeric: true });
    const filtered = list.filter(item => {
      const itemCourseId = String(item?.courseId?._id || item?.courseId || "");
      const itemUniversityId = String(
        item?.courseId?.universityId?._id || item?.courseId?.universityId || ""
      );
      const type = String(item?.courseType || "").trim();
      const courseName = String(item?.courseName || item?.courseId?.name || "");
      const universityName = String(item?.universityName || "");
      const semesterName = String(item?.name || "");

      const matchType = !filterType || type === filterType;
      const matchUniversity = !filterUniversityId || itemUniversityId === String(filterUniversityId);
      const matchCourse = !filterCourseId || itemCourseId === String(filterCourseId);
      const matchQuery =
        !q ||
        courseName.toLowerCase().includes(q) ||
        universityName.toLowerCase().includes(q) ||
        semesterName.toLowerCase().includes(q) ||
        type.toLowerCase().includes(q);

      return matchType && matchUniversity && matchCourse && matchQuery;
    });

    filtered.sort((a, b) => {
      const typeCmp = collator.compare(String(a?.courseType || ""), String(b?.courseType || ""));
      if (typeCmp !== 0) return typeCmp;
      const uniCmp = collator.compare(String(a?.universityName || ""), String(b?.universityName || ""));
      if (uniCmp !== 0) return uniCmp;
      const courseCmp = collator.compare(String(a?.courseName || ""), String(b?.courseName || ""));
      if (courseCmp !== 0) return courseCmp;
      return collator.compare(String(a?.name || ""), String(b?.name || ""));
    });

    return filtered;
  }, [list, filterType, filterUniversityId, filterCourseId, filterQuery]);

  const getCourseDetails = course => {
    if (!course) {
      return { courseName: "Unknown course", universityName: "-", type: "Other" };
    }
    const uniId = course?.universityId?._id || course?.universityId || "";
    const uni = universityMap.get(String(uniId));
    return {
      courseName: course?.name || "Unknown course",
      universityName: uni?.name || "-",
      type: course?.category || uni?.type || "Other"
    };
  };


  const add = async()=>{

    if(!name || !courseId){
      return alert("Fill all fields");
    }

    await axios.post(
      `${API}/api/semesters`,
      {name,courseId},
      headers
    );

    setName("");
    setCourseId("");

    load();
  };


  const del = async(id)=>{

    if(!window.confirm("Delete?")) return;

    await axios.delete(
      `${API}/api/semesters/${id}`,
      headers
    );

    load();
  };


  return(

    <Layout>


      {/* Add Form */}
      <div className="row mb-3">

        <div className="col-md-4">
          <select
            className="form-control"
            value={universityId}
            onChange={e => {
              setUniversityId(e.target.value);
              setCourseId("");
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

        <div className="col-md-4">

          <select
            className="form-control"
            value={courseId}
            onChange={e=>setCourseId(e.target.value)}
            disabled={!universityId}
          >
            <option value="">Select Course</option>

            {filteredCourses.map(c=>(
              <option key={c._id} value={c._id}>
                {getCourseDetails(c).courseName}
              </option>
            ))}

          </select>

        </div>


        <div className="col-md-2">

          <input
            className="form-control"
            placeholder="Semester Name"
            value={name}
            onChange={e=>setName(e.target.value)}
          />

        </div>


        <div className="col-md-2">

          <button
            onClick={add}
            className="btn btn-primary w-100"
          >
            Add Semester
          </button>

        </div>

      </div>

      <div className="row mb-3 g-2">
        <div className="col-md-2">
          <select className="form-control" value={filterType} onChange={e => setFilterType(e.target.value)}>
            <option value="">All Types</option>
            {allTypes.map(type => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
        <div className="col-md-3">
          <select
            className="form-control"
            value={filterUniversityId}
            onChange={e => {
              setFilterUniversityId(e.target.value);
              setFilterCourseId("");
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
        <div className="col-md-3">
          <select className="form-control" value={filterCourseId} onChange={e => setFilterCourseId(e.target.value)}>
            <option value="">All Courses</option>
            {tableFilteredCourses.map(c => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="col-md-4">
          <input
            className="form-control"
            placeholder="Search course/university/semester/type..."
            value={filterQuery}
            onChange={e => setFilterQuery(e.target.value)}
          />
        </div>
      </div>


      {/* Table */}
      <table className="table table-bordered shadow">

        <thead>
          <tr>
            <th>#</th>
            <th>Course Name</th>
            <th>University/Board</th>
            <th>Type</th>
            <th>Semester</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>

          {filteredList.map((s,i)=>(
            <tr key={s._id}>

              <td>{i+1}</td>

              {(() => {
                const id = s?.courseId?._id || s?.courseId || "";
                const course = courseMap.get(String(id)) || s?.courseId;
                const details = getCourseDetails(course);
                const courseName = s?.courseName || details.courseName;
                const universityName = s?.universityName || details.universityName;
                const type = s?.courseType || details.type;
                return (
                  <>
                    <td>{courseName}</td>
                    <td>{universityName}</td>
                    <td>{type}</td>
                  </>
                );
              })()}

              <td>{s.name}</td>

              <td>

                <button
                  onClick={()=>del(s._id)}
                  className="btn btn-danger btn-sm"
                >
                  Delete
                </button>

              </td>

            </tr>
          ))}
          {filteredList.length === 0 && (
            <tr>
              <td colSpan={6} className="text-center text-muted">
                No semesters found for selected filters.
              </td>
            </tr>
          )}

        </tbody>

      </table>

    </Layout>
  );
}

