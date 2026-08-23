"use client";

import { useId } from "react";
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
    updateScheduleItem(itemKey, { done: !isDone });
  };

  const updateMemo = (value: string) => {
    updateScheduleItem(itemKey, { memo: value });
  };

  return (
    <tr data-completed={isDone ? "true" : undefined}>
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
      </td>
      {isDone ? (
        <td className="completed-summary-cell" colSpan={5} data-label="완료">
          <div className="completed-summary">
            <b>{item.time}</b>
            <strong>{item.title}</strong>
          </div>
        </td>
      ) : (
        <>
          <td className="time-cell" data-label="시간">
            <span className="row-index">{String(index + 1).padStart(2, "0")}</span>
            <b>{item.time}</b>
          </td>
          <td className="place-cell" data-label="일정">
            <strong>{item.title}</strong>
            {descriptions.length > 0 && (
              <ul className="schedule-descriptions">
                {descriptions.map((description) => <li key={description}>{description}</li>)}
              </ul>
            )}
            {(item.map || item.route || visibleLinks?.length) && (
              <div className="item-actions">
                {item.map && (
                  <a
                    className="place-link"
                    href={item.map}
                    target={opensGoogleMaps(item.map) ? undefined : "_blank"}
                    rel={opensGoogleMaps(item.map) ? undefined : "noreferrer"}
                  >
                    장소 정보
                  </a>
                )}
                {item.route && <a className="route-link" href={item.route}>경로 보기</a>}
                {visibleLinks?.map((link) => (
                  <a className="resource-link" href={link.url} target="_blank" rel="noreferrer" key={link.url}>
                    {link.label}
                  </a>
                ))}
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
