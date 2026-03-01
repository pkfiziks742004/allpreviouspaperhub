import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import Layout from "../components/Layout";
const API = process.env.REACT_APP_API_BASE || "http://localhost:5000";

export default function Courses(){

  const [list,setList] = useState([]);
  const [name,setName] = useState("");
  const [category,setCategory] = useState("University");
  const [editNames, setEditNames] = useState({});
  const [editCategories, setEditCategories] = useState({});
  const [universities, setUniversities] = useState([]);
  const [universityId, setUniversityId] = useState("");
  const [editUniversityIds, setEditUniversityIds] = useState({});
  const [buttonLabel, setButtonLabel] = useState("");
  const [editButtonLabels, setEditButtonLabels] = useState({});

  const token = localStorage.getItem("token");

  const headers = {
    headers:{
      Authorization: token
    }
  };

  const load = useCallback(()=>{
    axios
      .get(`${API}/api/courses`)
      .then(res=>{
        const data = res.data || [];
        setList(data);
        setEditNames(prev => {
          const next = { ...prev };
          data.forEach(c => {
            if (next[c._id] === undefined) next[c._id] = c.name;
          });
          return next;
        });
        setEditCategories(prev => {
          const next = { ...prev };
          data.forEach(c => {
            if (next[c._id] === undefined) next[c._id] = c.category || "University";
          });
          return next;
        });
        setEditUniversityIds(prev => {
          const next = { ...prev };
          data.forEach(c => {
            if (next[c._id] === undefined) next[c._id] = c.universityId || "";
          });
          return next;
        });
        setEditButtonLabels(prev => {
          const next = { ...prev };
          data.forEach(c => {
            if (next[c._id] === undefined) next[c._id] = c.buttonLabel || "";
          });
          return next;
        });
      });
  }, []);

  const loadUniversities = useCallback(() => {
    axios
      .get(`${API}/api/universities`)
      .then(res => {
        const data = res.data || [];
        setUniversities(data);
        if (!universityId && data.length > 0) {
          setUniversityId(data[0]._id);
        }
      });
  }, [universityId]);

  useEffect(()=>{
    load();
    loadUniversities();
  },[load, loadUniversities]);


  const add = async()=>{

    if(!name) return alert("Enter course name");

    try {
      await axios.post(
        `${API}/api/courses`,
        {name, category, universityId: universityId || null, buttonLabel},
        headers
      );

      setName("");
      setCategory("University");
      setUniversityId("");
      setButtonLabel("");
      load();
    } catch (err) {
      alert(err?.response?.data || "Add failed");
    }
  };

  const update = async(id)=>{
    const newName = (editNames[id] || "").trim();
    if(!newName) return alert("Enter course name");

    try {
      await axios.put(
        `${API}/api/courses/${id}`,
        {
          name: newName,
          category: editCategories[id] || "University",
          universityId: editUniversityIds[id] || null,
          buttonLabel: editButtonLabels[id] || ""
        },
        headers
      );

      load();
    } catch (err) {
      alert(err?.response?.data || "Update failed");
    }
  };

  const del = async(id)=>{

    if(!window.confirm("Delete?")) return;

    await axios.delete(
      `${API}/api/courses/${id}`,
      headers
    );

    load();
  };


  return(

    <Layout>


      {/* Add Form */}
      <div className="d-flex mb-3">

        <input
          className="form-control me-2"
          placeholder="Course Name"
          value={name}
          onChange={e=>setName(e.target.value)}
        />

        <select
          className="form-select me-2"
          value={universityId}
          onChange={e=>setUniversityId(e.target.value)}
        >
          {universities.length === 0 && (
            <option value="">No university</option>
          )}
          {universities.map(u => (
            <option key={u._id} value={u._id}>
              {u.name} ({u.type || "University"})
            </option>
          ))}
        </select>

        <select
          className="form-select me-2"
          value={category}
          onChange={e=>setCategory(e.target.value)}
        >
          <option value="University">University</option>
          <option value="College">College</option>
          <option value="School">School</option>
          <option value="Entrance Exam">Entrance Exam</option>
          <option value="Other">Other</option>
        </select>

        <input
          className="form-control me-2"
          placeholder="Button label (optional)"
          value={buttonLabel}
          onChange={e=>setButtonLabel(e.target.value)}
        />

        <button
          onClick={add}
          className="btn btn-primary"
        >
          Add
        </button>

      </div>


      {/* List */}
      <table className="table table-bordered shadow">

        <thead>
          <tr>
            <th>#</th>
            <th>Name</th>
            <th>University</th>
            <th>Category</th>
            <th>Button Label</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>

          {list.map((c,i)=>(
            <tr key={c._id}>

              <td>{i+1}</td>
              <td>
                <input
                  className="form-control"
                  value={editNames[c._id] || ""}
                  onChange={e=>setEditNames({ ...editNames, [c._id]: e.target.value })}
                />
              </td>

              <td>
                <select
                  className="form-select"
                  value={editUniversityIds[c._id] || ""}
                  onChange={e=>setEditUniversityIds({ ...editUniversityIds, [c._id]: e.target.value })}
                >
                  <option value="">No university</option>
                  {universities.map(u => (
                    <option key={u._id} value={u._id}>
                      {u.name} ({u.type || "University"})
                    </option>
                  ))}
                </select>
              </td>

              <td>
                <input
                  className="form-control"
                  value={editButtonLabels[c._id] || ""}
                  onChange={e=>setEditButtonLabels({ ...editButtonLabels, [c._id]: e.target.value })}
                  placeholder="Optional custom label"
                />
              </td>

              <td>
                <select
                  className="form-select"
                  value={editCategories[c._id] || "University"}
                  onChange={e=>setEditCategories({ ...editCategories, [c._id]: e.target.value })}
                >
                  <option value="University">University</option>
                  <option value="College">College</option>
                  <option value="School">School</option>
                  <option value="Entrance Exam">Entrance Exam</option>
                  <option value="Other">Other</option>
                </select>
              </td>

              <td>

                <button
                  onClick={()=>update(c._id)}
                  className="btn btn-success btn-sm me-2"
                >
                  Update
                </button>

                <button
                  onClick={()=>del(c._id)}
                  className="btn btn-danger btn-sm"
                >
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

