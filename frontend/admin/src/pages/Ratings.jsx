import { useEffect, useState } from "react";
import axios from "axios";
import Layout from "../components/Layout";
const API = process.env.REACT_APP_API_BASE || "http://localhost:5000";

export default function Ratings() {
  const [list, setList] = useState([]);
  const token = localStorage.getItem("token");

  const headers = {
    headers: {
      Authorization: token
    }
  };

  const load = () => {
    axios
      .get(`${API}/api/site-rating/admin`, headers)
      .then(res => setList(res.data));
  };

  useEffect(() => {
    load();
  }, []);

  const del = async id => {
    if (!window.confirm("Delete?")) return;

    await axios.delete(
      `${API}/api/site-rating/${id}`,
      headers
    );

    load();
  };

  return (
    <Layout>

      <table className="table table-bordered">
        <thead>
          <tr>
            <th>#</th>
            <th>Rating</th>
            <th>Date</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {list.length === 0 && (
            <tr>
              <td colSpan={4} className="text-center text-muted">
                No ratings yet.
              </td>
            </tr>
          )}
          {list.map((r, i) => (
            <tr key={r._id}>
              <td>{i + 1}</td>
              <td>Rating: {r.rating}</td>
              <td>{new Date(r.createdAt).toLocaleDateString()}</td>

              <td>
                <button
                  onClick={() => del(r._id)}
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

