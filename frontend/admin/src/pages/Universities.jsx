import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import Layout from "../components/Layout";

const API = process.env.REACT_APP_API_BASE || "http://localhost:5000";
const BASE_TYPE_OPTIONS = ["University", "College", "School", "Entrance Exam"];

export default function Universities() {
  const [list, setList] = useState([]);
  const [name, setName] = useState("");
  const [type, setType] = useState("University");
  const [customType, setCustomType] = useState("");
  const [typeOptions, setTypeOptions] = useState(BASE_TYPE_OPTIONS);
  const [editNames, setEditNames] = useState({});
  const [editTypes, setEditTypes] = useState({});
  const [editCustomTypes, setEditCustomTypes] = useState({});
  const [editComingSoon, setEditComingSoon] = useState({});
  const [editComingSoonText, setEditComingSoonText] = useState({});
  const [uploading, setUploading] = useState({});

  const token = localStorage.getItem("token");
  const headers = { headers: { Authorization: token } };

  const persistTypeOptions = async options => {
    const cleaned = Array.from(new Set((options || []).map(v => String(v || "").trim()).filter(Boolean)));
    setTypeOptions(cleaned);
    try {
      await axios.put(`${API}/api/settings`, { universityTypeOptions: cleaned }, headers);
    } catch (err) {
      // ignore settings save errors here; university CRUD still works
    }
  };

  const addTypeOption = async rawName => {
    const v = String(rawName || "").trim();
    if (!v) return;
    if (!typeOptions.includes(v)) {
      await persistTypeOptions([...typeOptions, v]);
    }
  };

  const loadSettings = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/api/settings`);
      const saved = Array.isArray(res.data.universityTypeOptions) ? res.data.universityTypeOptions : BASE_TYPE_OPTIONS;
      const merged = Array.from(new Set([...BASE_TYPE_OPTIONS, ...saved]));
      setTypeOptions(merged);
    } catch (err) {
      // keep UI usable even if settings request is rate-limited
    }
  }, []);

  const load = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/api/universities`);
      const data = res.data || [];
      const typesFromData = data.map(u => String(u.type || "").trim()).filter(Boolean);

      setTypeOptions(prev =>
        Array.from(new Set([...BASE_TYPE_OPTIONS, ...prev, ...typesFromData]))
      );
      setList(data);
      setEditNames(prev => {
        const next = { ...prev };
        data.forEach(u => {
          if (next[u._id] === undefined) next[u._id] = u.name;
        });
        return next;
      });
      setEditTypes(prev => {
        const next = { ...prev };
        data.forEach(u => {
          if (next[u._id] === undefined) {
            const rawType = u.type || "University";
            next[u._id] = BASE_TYPE_OPTIONS.includes(rawType) ? rawType : rawType || "Other";
          }
        });
        return next;
      });
      setEditCustomTypes(prev => {
        const next = { ...prev };
        data.forEach(u => {
          if (next[u._id] === undefined) {
            const rawType = u.type || "University";
            next[u._id] = BASE_TYPE_OPTIONS.includes(rawType) ? "" : rawType;
          }
        });
        return next;
      });
      setEditComingSoon(prev => {
        const next = { ...prev };
        data.forEach(u => {
          if (next[u._id] === undefined) next[u._id] = !!u.comingSoon;
        });
        return next;
      });
      setEditComingSoonText(prev => {
        const next = { ...prev };
        data.forEach(u => {
          if (next[u._id] === undefined) next[u._id] = u.comingSoonText || "Coming soon";
        });
        return next;
      });
    } catch (err) {
      // avoid unhandled promise spam when server returns 429
    }
  }, []);

  useEffect(() => {
    loadSettings();
    load();
  }, [load, loadSettings]);

  const add = async () => {
    if (!name.trim()) return alert("Enter name");
    const finalType =
      type === "Other" ? (customType || "").trim() || "Other" : type;
    await axios.post(
      `${API}/api/universities`,
      { name: name.trim(), type: finalType },
      headers
    );
    await addTypeOption(finalType);
    setName("");
    setType("University");
    setCustomType("");
    load();
  };

  const update = async id => {
    const newName = (editNames[id] || "").trim();
    if (!newName) return alert("Enter name");
    const finalType =
      (editTypes[id] || "University") === "Other"
        ? (editCustomTypes[id] || "").trim() || "Other"
        : editTypes[id] || "University";
    await axios.put(
      `${API}/api/universities/${id}`,
      {
        name: newName,
        type: finalType,
        comingSoon: !!editComingSoon[id],
        comingSoonText: editComingSoonText[id] || "Coming soon"
      },
      headers
    );
    await addTypeOption(finalType);
    load();
  };

  const del = async id => {
    if (!window.confirm("Delete?")) return;
    await axios.delete(`${API}/api/universities/${id}`, headers);
    load();
  };

  const uploadLogo = async (id, file) => {
    if (!file) return;
    setUploading(prev => ({ ...prev, [id]: true }));
    try {
      const fd = new FormData();
      fd.append("logo", file);
      await axios.post(`${API}/api/universities/${id}/logo`, fd, headers);
      load();
    } catch (err) {
      alert("Logo upload failed");
    } finally {
      setUploading(prev => ({ ...prev, [id]: false }));
    }
  };

  const resolveUrl = url => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    return `${API}${url}`;
  };

  return (
    <Layout>

      <div className="d-flex mb-3 gap-2">
        <input
          className="form-control"
          placeholder="Name"
          value={name}
          onChange={e => setName(e.target.value)}
        />
        <select
          className="form-select"
          value={type}
          onChange={e => {
            const v = e.target.value;
            if (v === "__add_new__") {
              setType("Other");
              return;
            }
            setType(v);
          }}
        >
          {typeOptions.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
          <option value="Other">Other</option>
          <option value="__add_new__">+ Add New Type</option>
        </select>
        {type === "Other" && (
          <>
            <input
              className="form-control"
              placeholder="Enter custom type name"
              value={customType}
              onChange={e => setCustomType(e.target.value)}
            />
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={async () => {
                const v = (customType || "").trim();
                if (!v) return;
                await addTypeOption(v);
                setType(v);
              }}
            >
              Save Type
            </button>
          </>
        )}
        <button onClick={add} className="btn btn-primary">
          Add
        </button>
      </div>

      <table className="table table-bordered shadow">
        <thead>
          <tr>
            <th>#</th>
            <th>Logo</th>
            <th>Name</th>
            <th>Type</th>
            <th>Upload Logo</th>
            <th>Coming Soon</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {list.map((u, i) => (
            <tr key={u._id}>
              <td>{i + 1}</td>
              <td>
                {u.logoUrl ? (
                  <img
                    src={resolveUrl(u.logoUrl)}
                    alt={u.name}
                    style={{ height: "32px" }}
                  />
                ) : (
                  <span className="text-muted">No logo</span>
                )}
              </td>
              <td>
                <input
                  className="form-control"
                  value={editNames[u._id] || ""}
                  onChange={e =>
                    setEditNames({ ...editNames, [u._id]: e.target.value })
                  }
                />
              </td>
              <td>
                <select
                  className="form-select"
                  value={editTypes[u._id] || "University"}
                  onChange={e => {
                    const v = e.target.value;
                    if (v === "__add_new__") {
                      setEditTypes({ ...editTypes, [u._id]: "Other" });
                      return;
                    }
                    setEditTypes({ ...editTypes, [u._id]: v });
                  }}
                >
                  {typeOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                  <option value="Other">Other</option>
                  <option value="__add_new__">+ Add New Type</option>
                </select>
                {(editTypes[u._id] || "University") === "Other" && (
                  <>
                    <input
                      className="form-control mt-2"
                      placeholder="Enter custom type name"
                      value={editCustomTypes[u._id] || ""}
                      onChange={e =>
                        setEditCustomTypes({
                          ...editCustomTypes,
                          [u._id]: e.target.value
                        })
                      }
                    />
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary mt-2"
                      onClick={async () => {
                        const v = (editCustomTypes[u._id] || "").trim();
                        if (!v) return;
                        await addTypeOption(v);
                        setEditTypes({ ...editTypes, [u._id]: v });
                      }}
                    >
                      Save Type
                    </button>
                  </>
                )}
              </td>
              <td>
                <input
                  type="file"
                  className="form-control"
                  accept="image/*"
                  onChange={e => uploadLogo(u._id, e.target.files && e.target.files[0])}
                  disabled={!!uploading[u._id]}
                />
              </td>
              <td>
                <div className="form-check mb-2">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id={`coming-soon-${u._id}`}
                    checked={!!editComingSoon[u._id]}
                    onChange={e =>
                      setEditComingSoon({ ...editComingSoon, [u._id]: e.target.checked })
                    }
                  />
                  <label className="form-check-label" htmlFor={`coming-soon-${u._id}`}>
                    Coming soon
                  </label>
                </div>
                <input
                  className="form-control"
                  placeholder="Coming soon text"
                  value={editComingSoonText[u._id] || ""}
                  onChange={e =>
                    setEditComingSoonText({ ...editComingSoonText, [u._id]: e.target.value })
                  }
                />
              </td>
              <td>
                <button
                  onClick={() => update(u._id)}
                  className="btn btn-success btn-sm me-2"
                >
                  Update
                </button>
                <button
                  onClick={() => del(u._id)}
                  className="btn btn-danger btn-sm"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}

          {list.length === 0 && (
            <tr>
              <td colSpan="7" className="text-muted text-center">
                No entries yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </Layout>
  );
}

