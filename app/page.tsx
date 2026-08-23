import type { Metadata } from "next";
import CollapsibleDay from "./collapsible-day";
import DayNavigation from "./day-navigation";
import PrepChecklist from "./prep-checklist";
import ScheduleRow from "./schedule-row";
import { FirebaseSyncProvider, FirebaseSyncStatus } from "./firebase-sync-provider";
import { tripDays, tripInfo, type FoodCard, type ScheduleItem, type TripDay } from "./trip-data";

export const metadata: Metadata = {
  title: "타이베이 3박 4일 일정표",
  description: "예약 현황, 이동 방법, 비용과 메모를 한눈에 확인하는 타이베이 여행 일정표",
};

type TimelineEntry =
  | { key: string; item: ScheduleItem }
  | { key: string; card: FoodCard };

function buildTimeline(day: TripDay): TimelineEntry[] {
  const timeline: TimelineEntry[] = day.foodCards
    .filter((card) => !card.afterItem)
    .map((card) => ({ key: card.id, card }));

  day.items.forEach((item) => {
    timeline.push({ key: `${item.time}-${item.title}`, item });
    day.foodCards
      .filter((card) => card.afterItem === item.title)
      .forEach((card) => timeline.push({ key: card.id, card }));
  });

  return timeline;
}

function foodCardToScheduleItem(card: FoodCard): ScheduleItem {
  return {
    time: card.slots.map((slot) => slot.time).join(" · "),
    title: card.slots.map((slot) => slot.title).join(" · "),
    subtitle: card.slots.map((slot) => slot.detail).join(" / "),
    transport: "현재 동선 내",
    booking: "선택",
    cost: "현장 선택",
    note: card.recommendations ? "" : "동선과 대기시간에 맞춰 장소를 선택.",
    recommendations: card.recommendations,
  };
}

export default function Home() {
  return (
    <FirebaseSyncProvider>
      <main className="planner-shell" id="top">
        <nav className="topbar" aria-label="일정표 상단 메뉴">
          <a className="brand" href="#top">
            <span aria-hidden="true">台</span>
            <b>TAIPEI<br />TRIP TABLE</b>
          </a>
          <FirebaseSyncStatus />
        </nav>

        <header className="planner-hero">
          <div>
            <p className="eyebrow">TRAVEL PLAN · 2026</p>
            <h1>{tripInfo.title}</h1>
            <p className="date-range">{tripInfo.dates}</p>
          </div>
        </header>

        <PrepChecklist />

        <DayNavigation days={tripDays} />

        <section className="schedule" aria-label="3박 4일 전체 일정">
          {tripDays.map((day) => (
            <CollapsibleDay
              key={day.id}
              id={day.id}
              color={day.color}
              day={day.day}
              date={day.date}
              weekday={day.weekday}
              area={day.area}
              theme={day.theme}
              dayRoute={day.dayRoute}
            >
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th scope="col" aria-label="완료 여부" />
                      <th scope="col">시간</th>
                      <th scope="col">일정</th>
                      <th scope="col">이동</th>
                      <th scope="col">비용</th>
                      <th scope="col">메모</th>
                    </tr>
                  </thead>
                  <tbody>
                    {buildTimeline(day).map((entry, index) => {
                      const item = "item" in entry ? entry.item : foodCardToScheduleItem(entry.card);
                      return <ScheduleRow dayId={day.id} index={index} item={item} key={entry.key} />;
                    })}
                  </tbody>
                </table>
              </div>
            </CollapsibleDay>
          ))}
        </section>
      </main>
    </FirebaseSyncProvider>
  );
}
