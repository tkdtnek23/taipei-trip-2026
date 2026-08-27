"use client";

import { useId, useState } from "react";
import type { ScheduleItem } from "./trip-data";
import { getScheduleItemKey, useTripSync } from "./firebase-sync-provider";

type ScheduleRowProps = {
  dayId: string;
  index: number;
  item: ScheduleItem;
};

function getScheduleDescriptions(item: ScheduleItem) {
  const seen = new Set<string>();

  return [item.subtitle, item.note]
    .flatMap((description) => description?.split(/\s+·\s+/u) ?? [])
    .map((description) => description.trim())
    .filter((description) => {
      if (!description) return false;
      const normalized = description.replace(/[\s.]/g, "");
      if (seen.has(normalized)) return false;
      seen.add(normalized);
      return true;
    });
}

function opensGoogleMaps(url: string) {
  return url.startsWith("https://www.google.com/maps/");
}

export default function ScheduleRow({ dayId, index, item }: ScheduleRowProps) {
  const { state, ready, updateScheduleItem } = useTripSync();
  const inputId = useId();
  const [collapseOverride, setCollapseOverride] = useState<{ forDone: boolean; collapsed: boolean } | null>(null);
  const itemKey = getScheduleItemKey(dayId, item.time, item.title);
  const itemState = state.schedule[itemKey] ?? { done: false, memo: "" };
  const isDone = itemState.done;
  const memo = itemState.memo;
  const descriptions = getScheduleDescriptions(item);
  const visibleLinks = item.links?.flatMap((link) => {
    const url = link.url ?? (link.privateKey ? state.privateLinks[link.privateKey] : undefined);
    return url ? [{ ...link, url }] : [];
  });

  const toggleDone = () => {
    setCollapseOverride(null);
    updateScheduleItem(itemKey, { done: !isDone });
  };

  const updateMemo = (value: string) => {
    updateScheduleItem(itemKey, { memo: value });
  };

  const isCollapsed = collapseOverride?.forDone === isDone
    ? collapseOverride.collapsed
    : isDone;

  return (
    <tr
      className="schedule-row-target"
      id={`schedule-${dayId}-${index + 1}`}
      data-completed={isDone && isCollapsed ? "true" : undefined}
      data-done={isDone ? "true" : undefined}
    >
      <td className="status-cell" data-label="완료 여부">
        <label className="schedule-check" htmlFor={inputId}>
          <input
            id={inputId}
            type="checkbox"
            checked={isDone}
            onChange={toggleDone}
            disabled={!ready}
            aria-label={`${item.title} 완료 여부`}
          />
          <span className="schedule-checkmark" aria-hidden="true">✓</span>
        </label>
        <strong className="mobile-card-title">{item.title}</strong>
        <button
          className="mobile-row-toggle"
          type="button"
          onClick={() => setCollapseOverride({ forDone: isDone, collapsed: !isCollapsed })}
          aria-label={`${item.title} 일정 ${isCollapsed ? "펼치기" : "접기"}`}
        >
          <span aria-hidden="true">{isCollapsed ? "⌄" : "⌃"}</span>
        </button>
      </td>
      {isCollapsed ? (
        <td className="completed-summary-cell" colSpan={5} data-label={isDone ? "완료" : "접힌 일정"}>
          <div className="completed-summary">
            <b>{item.time}</b>
            <strong>{item.title}</strong>
            <button
              className="schedule-expand-button"
              type="button"
              onClick={() => setCollapseOverride({ forDone: isDone, collapsed: false })}
              aria-label={`${item.title} 일정 펼치기`}
            >
              <span aria-hidden="true">⌄</span>
            </button>
          </div>
        </td>
      ) : (
        <>
          <td className="time-cell" data-label="시간">
            <span className="row-index">{String(index + 1).padStart(2, "0")}</span>
            <b>{item.time}</b>
            <button
              className="schedule-collapse-button"
              type="button"
              onClick={() => setCollapseOverride({ forDone: isDone, collapsed: true })}
              aria-label={`${item.title} 일정 접기`}
            >
              <span aria-hidden="true">⌃</span>
            </button>
          </td>
          <td className="place-cell" data-label="내용">
            <strong>{item.title}</strong>
            {descriptions.length > 0 && (
              <ul className="schedule-descriptions">
                {descriptions.map((description) => <li key={description}>{description}</li>)}
              </ul>
            )}
            {(item.map || item.route) && (
              <div className="item-actions item-map-actions">
                {item.map && (
                  <a
                    className="place-link"
                    href={item.map}
                    aria-label={`${item.title} 장소 정보 보기`}
                    title="장소 정보"
                    target={opensGoogleMaps(item.map) ? undefined : "_blank"}
                    rel={opensGoogleMaps(item.map) ? undefined : "noreferrer"}
                  >
                    <svg aria-hidden="true" viewBox="0 0 24 24">
                      <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
                      <circle cx="12" cy="10" r="2.5" />
                    </svg>
                  </a>
                )}
                {item.route && (
                  <a
                    className="route-link"
                    href={item.route}
                    aria-label={`${item.title} 이동 경로 보기`}
                    title="경로 보기"
                  >
                    <svg aria-hidden="true" viewBox="0 0 24 24">
                      <circle cx="6" cy="18" r="2" />
                      <circle cx="18" cy="6" r="2" />
                      <path d="M8 18h2a4 4 0 0 0 4-4v-4a4 4 0 0 1 4-4" />
                    </svg>
                  </a>
                )}
              </div>
            )}
            {visibleLinks && visibleLinks.length > 0 && (
              <div className="related-resources">
                <strong>관련 링크</strong>
                <div>
                  {visibleLinks.map((link) => (
                    <a className="resource-link" href={link.url} target="_blank" rel="noreferrer" key={link.url}>
                      {link.label}
                    </a>
                  ))}
                </div>
              </div>
            )}
            {item.recommendations && (
              <div className="food-recommendations">
                <strong>추천</strong>
                <div>
                  {item.recommendations.map((place) => (
                    <a href={place.map} key={place.name}>{place.name}</a>
                  ))}
                </div>
              </div>
            )}
          </td>
          <td className="transport-cell" data-label="이동">{item.transport}</td>
          <td className="cost-cell" data-label="비용">{item.cost}</td>
          <td className="memo-cell" data-label="메모">
            <textarea
              value={memo}
              onChange={(event) => updateMemo(event.target.value)}
              disabled={!ready}
              placeholder="메모 입력"
              aria-label={`${item.title} 메모`}
              rows={3}
            />
          </td>
        </>
      )}
    </tr>
  );
}
