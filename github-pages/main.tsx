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

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  const hadController = Boolean(navigator.serviceWorker.controller);

  window.addEventListener("load", () => {
    if (hadController) {
      let refreshing = false;
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (refreshing) return;
        refreshing = true;
        window.location.reload();
      });
    }

    void navigator.serviceWorker
      .register(new URL("./sw.js", document.baseURI), { updateViaCache: "none" })
      .then((registration) => registration.update())
      .catch(() => {
        // 캐시를 지원하지 않는 환경에서는 온라인 페이지로 계속 동작합니다.
      });
  }, { once: true });
}
