import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { applyDocumentTheme, readStoredTheme } from "./lib/theme";

const initialTheme = readStoredTheme() ?? "light";
applyDocumentTheme(initialTheme);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <App />
);
