import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { getStoredRole } from "../config/permissions";

const CATEGORY_LINKS = [
  { title: "Universities / Boards", desc: "Manage University, College, School, Entrance Exam", to: "/universities" },
  { title: "Courses", desc: "Manage courses like B.Tech, Diploma, 12th, SSC, UPSC", to: "/courses" },
  { title: "Semesters / Classes", desc: "Manage semester and class level options", to: "/semesters" },
  { title: "Course Sections", desc: "Manage branch-like sections and card grouping", to: "/course-sections" },
  { title: "University Types", desc: "Control type labels and action button text", to: "/university-settings" },
  { title: "Question Paper Labels", desc: "Control paper section labels and buttons", to: "/question-paper-settings" }
];

export default function CategoryManagement() {
  const navigate = useNavigate();
  const basePath = getStoredRole() === "sub_admin" ? "/sub-admin" : "/admin";

  return (
    <Layout>
      <p className="text-muted mb-4">
        Category tree ko yahin se maintain karo. Is structure se search filters aur paper pages clean rahenge.
      </p>
      <div className="row g-3">
        {CATEGORY_LINKS.map(item => (
          <div className="col-lg-4 col-md-6" key={item.to}>
            <div className="card h-100">
              <div className="card-body">
                <h5 className="card-title">{item.title}</h5>
                <p className="card-text text-muted">{item.desc}</p>
                <button className="btn btn-primary btn-sm" onClick={() => navigate(`${basePath}${item.to}`)}>
                  Open
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Layout>
  );
}
