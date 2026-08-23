"use client";

import { useState, type ReactNode } from "react";

type CollapsibleDayProps = {
  id: string;
  color: string;
  day: string;
  date: string;
  weekday: string;
  area: string;
  theme: string;
  dayRoute: string;
  children: ReactNode;
};

export default function CollapsibleDay({
  id,
  color,
  day,
  date,
  weekday,
  area,
  theme,
  dayRoute,
  children,
}: CollapsibleDayProps) {
  const [collapsed, setCollapsed] = useState(false);
  const contentId = `${id}-schedule`;
  const titleId = `${id}-title`;

  return (
    <article className={`day-section accent-${color}${collapsed ? " is-collapsed" : ""}`} id={id}>
      <header className="day-heading">
        <div className="day-date"><b>{day}</b><strong>{date}</strong><span>{weekday}</span></div>
        <div className="day-title"><span>{area}</span><h2 id={titleId}>{theme}</h2></div>
        <div className="day-heading-actions">
          <a
            className="day-route-link"
            href={dayRoute}
            aria-label={`${day} 전체 이동 경로를 Google 지도에서 보기`}
          >
            전체 경로 ↗
          </a>
          <button
            className="day-collapse-button"
            type="button"
            aria-expanded={!collapsed}
            aria-controls={contentId}
            onClick={() => setCollapsed((current) => !current)}
          >
            {collapsed ? "펼치기 ↓" : "접기 ↑"}
          </button>
        </div>
      </header>

      <div id={contentId} aria-labelledby={titleId} hidden={collapsed}>
        {children}
      </div>
    </article>
  );
}
