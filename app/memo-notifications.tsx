"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getScheduleItemKey, useTripSync } from "./firebase-sync-provider";

export type MemoNotificationTarget = {
  dayId: string;
  day: string;
  index: number;
  time: string;
  title: string;
};

type SeenMemos = Record<string, string>;

const seenMemosStorageKey = "taipei-trip-memo-notifications-seen-v1";

function summarizeMemo(memo: string) {
  const normalized = memo.replace(/\s+/gu, " ").trim();
  return normalized.length > 90 ? `${normalized.slice(0, 90)}…` : normalized;
}

function saveSeenMemos(value: SeenMemos) {
  try {
    window.localStorage.setItem(seenMemosStorageKey, JSON.stringify(value));
  } catch {
    // 알림 읽음 상태를 저장할 수 없어도 메모 자체의 동작에는 영향이 없습니다.
  }
}

export default function MemoNotifications({ targets }: { targets: MemoNotificationTarget[] }) {
  const { state, ready } = useTripSync();
  const [isOpen, setIsOpen] = useState(false);
  const [seenMemos, setSeenMemos] = useState<SeenMemos | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const memos = useMemo(() => targets.flatMap((target) => {
    const key = getScheduleItemKey(target.dayId, target.time, target.title);
    const memo = state.schedule[key]?.memo.trim();

    return memo ? [{ ...target, key, memo }] : [];
  }), [state.schedule, targets]);

  useEffect(() => {
    if (!ready || seenMemos !== null) return;

    let initialSeenMemos: SeenMemos | null = null;
    try {
      const stored = window.localStorage.getItem(seenMemosStorageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as unknown;
        if (parsed && typeof parsed === "object") {
          initialSeenMemos = parsed as SeenMemos;
        }
      }
    } catch {
      // 최초 기준 상태를 아래에서 새로 만듭니다.
    }

    const baseline = initialSeenMemos ?? Object.fromEntries(memos.map(({ key, memo }) => [key, memo]));
    const timer = window.setTimeout(() => {
      setSeenMemos(baseline);
      if (!initialSeenMemos) saveSeenMemos(baseline);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [memos, ready, seenMemos]);

  useEffect(() => {
    if (!isOpen) return;

    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  const unreadCount = seenMemos
    ? memos.filter(({ key, memo }) => seenMemos[key] !== memo).length
    : 0;

  const markAllAsRead = () => {
    if (!seenMemos) return;
    const next = { ...seenMemos };
    memos.forEach(({ key, memo }) => { next[key] = memo; });
    setSeenMemos(next);
    saveSeenMemos(next);
  };

  const togglePanel = () => {
    const nextOpen = !isOpen;
    setIsOpen(nextOpen);
    if (nextOpen) markAllAsRead();
  };

  const goToMemo = (target: MemoNotificationTarget & { key: string; memo: string }) => {
    setIsOpen(false);

    const dayContent = document.getElementById(`${target.dayId}-schedule`);
    const wasHidden = Boolean(dayContent?.hidden);
    if (wasHidden) {
      document
        .getElementById(target.dayId)
        ?.querySelector<HTMLButtonElement>(".day-collapse-button")
        ?.click();
    }

    window.setTimeout(() => {
      const row = document.getElementById(`schedule-${target.dayId}-${target.index + 1}`);
      if (!row) return;
      row.scrollIntoView({ behavior: "smooth", block: "center" });
      row.classList.add("memo-target-highlight");
      window.setTimeout(() => row.classList.remove("memo-target-highlight"), 1800);
    }, wasHidden ? 80 : 0);
  };

  return (
    <div className="memo-notifications" ref={containerRef}>
      <button
        className="memo-notification-toggle"
        type="button"
        aria-label="메모 알림"
        aria-expanded={isOpen}
        aria-controls="memo-notification-panel"
        onClick={togglePanel}
      >
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
        </svg>
        {unreadCount > 0 && <b aria-label={`읽지 않은 메모 ${unreadCount}개`}>{unreadCount}</b>}
      </button>

      {isOpen && (
        <section className="memo-notification-panel" id="memo-notification-panel" aria-label="메모 알림">
          <header>
            <div>
              <p>MEMO UPDATE</p>
              <h2>메모 알림</h2>
            </div>
            <span>{memos.length}개</span>
          </header>
          {memos.length > 0 ? (
            <div className="memo-notification-list">
              {memos.map((memo) => (
                <button type="button" onClick={() => goToMemo(memo)} key={memo.key}>
                  <span>{memo.day} · {memo.time}</span>
                  <strong>{memo.title}</strong>
                  <small>{summarizeMemo(memo.memo)}</small>
                </button>
              ))}
            </div>
          ) : (
            <p className="memo-notification-empty">입력된 메모가 없습니다.</p>
          )}
        </section>
      )}
    </div>
  );
}
