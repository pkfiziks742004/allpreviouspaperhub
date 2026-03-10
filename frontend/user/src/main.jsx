import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

try {
  const url = new URL(window.location.href);
  if (url.searchParams.has("_fresh")) {
    url.searchParams.delete("_fresh");
    window.history.replaceState(window.history.state, "", url.toString());
  }
  sessionStorage.removeItem("user_frontend_chunk_retry");
} catch (e) {
  // ignore URL/session storage cleanup failures
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
