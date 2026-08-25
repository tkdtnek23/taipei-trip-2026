"use client";

import { useEffect, useRef, useState } from "react";

type DayLink = {
  id: string;
  day: string;
  date: string;
  weekday: string;
};

export default function DayNavigation({ days }: { days: DayLink[] }) {
  const [activeDay, setActiveDay] = useState(days[0]?.id ?? "");
  const navRef = useRef<HTMLElement>(null);
  const linkRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const navigationTargetRef = useRef("");
  const navigationTimerRef = useRef<number | null>(null);

  useEffect(() => {
    let frame = 0;

    const updateActiveDay = () => {
      frame = 0;
      if (navigationTargetRef.current) {
        setActiveDay(navigationTargetRef.current);
        return;
      }

      const navBottom = navRef.current?.getBoundingClientRect().bottom ?? 0;
      let nextDay = days[0]?.id ?? "";

      for (const day of days) {
        const section = document.getElementById(day.id);
        if (!section || section.getBoundingClientRect().top > navBottom + 24) break;
        nextDay = day.id;
      }

      setActiveDay((current) => current === nextDay ? current : nextDay);
    };

    const scheduleUpdate = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(updateActiveDay);
    };

    scheduleUpdate();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);

    return () => {
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      if (frame) window.cancelAnimationFrame(frame);
      if (navigationTimerRef.current !== null) window.clearTimeout(navigationTimerRef.current);
    };
  }, [days]);

  const selectDay = (dayId: string) => {
    navigationTargetRef.current = dayId;
    setActiveDay(dayId);

    if (navigationTimerRef.current !== null) window.clearTimeout(navigationTimerRef.current);
    navigationTimerRef.current = window.setTimeout(() => {
      navigationTargetRef.current = "";
      navigationTimerRef.current = null;
    }, 1600);
  };

  useEffect(() => {
    const nav = navRef.current;
    const link = linkRefs.current[activeDay];
    if (!nav || !link) return;

    const left = link.offsetLeft - (nav.clientWidth - link.offsetWidth) / 2;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    nav.scrollTo({
      left: Math.max(0, left),
      behavior: reducedMotion ? "auto" : "smooth",
    });
  }, [activeDay]);

  return (
    <nav ref={navRef} className="day-nav" aria-label="날짜 바로가기">
      {days.map((day) => {
        const isActive = activeDay === day.id;

        return (
          <a
            key={day.id}
            ref={(element) => { linkRefs.current[day.id] = element; }}
            className={isActive ? "is-active" : undefined}
            href={`#${day.id}`}
            aria-current={isActive ? "date" : undefined}
            onClick={() => selectDay(day.id)}
          >
            <b>{day.day}</b><span>{day.date} · {day.weekday}</span>
          </a>
        );
      })}
    </nav>
  );
}
