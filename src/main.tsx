import { createRoot } from "react-dom/client";
import { App } from "./App.tsx";
import "./index.css";

const rootElement = createRoot(document.getElementById("root")!);
rootElement.render(<App />);
