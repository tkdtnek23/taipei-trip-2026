import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import TripPlanner from "../app/page";
import "../app/globals.css";

const root = document.getElementById("root");

if (!root) throw new Error("페이지를 표시할 영역을 찾을 수 없습니다.");

createRoot(root).render(
  <StrictMode>
    <TripPlanner />
  </StrictMode>,
);
