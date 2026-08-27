"use client";

import { useEffect, useRef, useState } from "react";

const refreshThreshold = 50;
const maximumPull = 72;

export default function PullToRefresh() {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef<number | null>(null);
  const distanceRef = useRef(0);

  useEffect(() => {
    const reset = () => {
      startY.current = null;
      distanceRef.current = 0;
      setPullDistance(0);
    };

    const refresh = async () => {
      setIsRefreshing(true);
      startY.current = null;
      distanceRef.current = 0;
      setPullDistance(refreshThreshold);

      try {
        if ("serviceWorker" in navigator) {
          const registration = await navigator.serviceWorker.getRegistration();
          await registration?.update();
        }
      } catch {
        // 업데이트 확인에 실패해도 현재 네트워크 상태로 다시 불러옵니다.
      }

      window.setTimeout(() => window.location.reload(), 350);
    };

    const onTouchStart = (event: TouchEvent) => {
      if (isRefreshing || event.touches.length !== 1 || window.scrollY > 0) return;
      startY.current = event.touches[0].clientY;
    };

    const onTouchMove = (event: TouchEvent) => {
      if (startY.current === null || event.touches.length !== 1) return;

      if (window.scrollY > 0) {
        reset();
        return;
      }

      const rawDistance = event.touches[0].clientY - startY.current;
      if (rawDistance <= 0) {
        distanceRef.current = 0;
        setPullDistance(0);
        return;
      }

      event.preventDefault();
      const dampedDistance = Math.min(maximumPull, rawDistance * .48);
      distanceRef.current = dampedDistance;
      setPullDistance(dampedDistance);
    };

    const onTouchEnd = () => {
      if (startY.current === null) return;
      if (distanceRef.current >= refreshThreshold) void refresh();
      else reset();
    };

    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchmove", onTouchMove, { passive: false });
    document.addEventListener("touchend", onTouchEnd, { passive: true });
    document.addEventListener("touchcancel", reset, { passive: true });

    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
      document.removeEventListener("touchcancel", reset);
    };
  }, [isRefreshing]);

  const isVisible = isRefreshing || pullDistance > 4;
  const isReady = pullDistance >= refreshThreshold;

  return (
    <div
      className="pull-refresh-indicator"
      data-visible={isVisible ? "true" : undefined}
      data-ready={isReady ? "true" : undefined}
      data-refreshing={isRefreshing ? "true" : undefined}
      aria-hidden={!isVisible}
      aria-live="polite"
    >
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="M20 11a8 8 0 1 0-2.34 5.66M20 5v6h-6" />
      </svg>
      <span>{isRefreshing ? "업데이트 확인 중" : isReady ? "놓으면 새로고침" : "아래로 더 당기기"}</span>
    </div>
  );
}
