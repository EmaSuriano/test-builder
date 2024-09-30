import { createRoot } from "react-dom/client";
import SurveyComponent from "./SurveyComponent.tsx";
import "./index.css";

const rootElement = createRoot(document.getElementById("root")!);
rootElement.render(<SurveyComponent />);
