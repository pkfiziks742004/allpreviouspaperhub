import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
const API = process.env.REACT_APP_API_BASE || "http://localhost:5000";

export default function Login(){

  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");

  const nav = useNavigate();

  const submit = async(e)=>{
    e.preventDefault();

    try{

      const res = await axios.post(
        `${API}/api/auth/login`,
        {email,password}
      );

      localStorage.setItem("token",res.data.token);
      localStorage.setItem("role", res.data.role || "sub_admin");
      localStorage.setItem("permissions", JSON.stringify(res.data.permissions || {}));

      nav("/admin/dashboard");

    }catch(err){
      alert(err?.response?.data || "Invalid Login");
    }
  };


  return(

    <div className="container mt-5">

      <div className="row justify-content-center">

        <div className="col-md-4">

          <div className="card p-4 shadow">

            <h4 className="text-center mb-3">
              Admin Login
            </h4>

            <form onSubmit={submit}>

              <input
                className="form-control mb-3"
                placeholder="Email"
                value={email}
                onChange={e=>setEmail(e.target.value)}
              />

              <input
                type="password"
                className="form-control mb-3"
                placeholder="Password"
                value={password}
                onChange={e=>setPassword(e.target.value)}
              />

              <button className="btn btn-primary w-100">
                Login
              </button>

            </form>

          </div>

        </div>

      </div>

    </div>
  );
}
