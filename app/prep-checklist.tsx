"use client";

import { useState } from "react";
import { useTripSync } from "./firebase-sync-provider";

type ChecklistGroup = {
  title: string;
  items: { id: string; label: string; detail?: string }[];
};

const checklistGroups: ChecklistGroup[] = [
  {
    title: "서류 · 입국",
    items: [
      { id: "passport", label: "여권 유효기간과 영문명 확인", detail: "출국일 기준 유효기간 6개월 이상 권장" },
      { id: "twac", label: "대만 온라인 입국신고서(TWAC) 작성", detail: "완료 화면을 휴대전화에 저장" },
      { id: "bookings", label: "항공권·호텔 예약확정서 오프라인 저장" },
      {
        id: "insurance",
        label: "여행자보험 2인 가입 완료",
        detail: "고급플랜 성인형 · 계약상태 정상 · 총 보험료 32,750원",
      },
    ],
  },
  {
    title: "항공 · 예약",
    items: [
      { id: "flight-check", label: "아시아나 앱에서 항공편·터미널 최종 확인", detail: "출발 전 인천공항 이용 터미널 재확인" },
      { id: "bus-ticket", label: "공항버스 예매 내역과 탑승 위치 저장" },
      {
        id: "museum",
        label: "고궁박물원 투어·입장권 바우처 저장",
        detail: "투어·입장권 각 2인 · 8/29 09:45 B1 손문 동상 반대편 GTS 안내문 앞 · 수신기 NT$100 현금",
      },
      { id: "hotel-address", label: "호텔 영문·중문 주소 확인" },
    ],
  },
  {
    title: "통신 · 결제",
    items: [
      { id: "esim", label: "대만 eSIM·로밍 준비", detail: "설치 후 출국 전에는 데이터 회선 전환 금지" },
      { id: "esim-verification", label: "대만 eSIM 실명인증 완료", detail: "사용 지역은 Taiwan, China 선택" },
      { id: "cards", label: "해외 사용 카드와 소액 현금 준비" },
      { id: "easycard", label: "이지카드 구입·충전 계획 확인" },
    ],
  },
  {
    title: "짐 · 당일",
    items: [
      { id: "battery", label: "보조배터리는 기내 휴대 수하물에 넣기" },
      { id: "adapter", label: "110V용 여행 어댑터·충전 케이블 챙기기" },
      { id: "footbath", label: "베이터우 족욕용 작은 수건 챙기기" },
      { id: "weather", label: "출발 전 타이베이 날씨 확인", detail: "우산·얇은 겉옷·편한 신발 준비" },
    ],
  },
];

export default function PrepChecklist() {
  const { state, ready, user, updateChecklist } = useTripSync();
  const checked = state.checklist;
  const [isOpen, setIsOpen] = useState(false);

  const allItems = checklistGroups.flatMap((group) => group.items);

  const toggle = (id: string) => {
    updateChecklist(
      checked.includes(id) ? checked.filter((item) => item !== id) : [...checked, id],
    );
  };

  const progress = allItems.length === 0 ? 0 : Math.round((checked.length / allItems.length) * 100);

  return (
    <section className="prep-checklist" aria-labelledby="prep-title">
      <header className="prep-heading">
        <div>
          <p>PRE-TRIP CHECKLIST</p>
          <h2 id="prep-title">여행 준비 체크리스트</h2>
        </div>
        <div className="prep-actions">
          <div className="prep-progress" aria-live="polite">
            <strong>{checked.length}<span>/{allItems.length}</span></strong>
            <span>준비 완료</span>
          </div>
          <button
            className="prep-toggle"
            type="button"
            aria-expanded={isOpen}
            aria-controls="prep-checklist-content"
            onClick={() => setIsOpen((current) => !current)}
          >
            {isOpen ? "접기" : "펼치기"}<span aria-hidden="true">{isOpen ? "↑" : "↓"}</span>
          </button>
        </div>
      </header>

      <div id="prep-checklist-content" hidden={!isOpen}>
        <div className="progress-track" aria-hidden="true">
          <span style={{ width: `${progress}%` }} />
        </div>

        <div className="checklist-grid">
          {checklistGroups.map((group) => (
            <section className="checklist-group" key={group.title}>
              <h3>{group.title}</h3>
              <div>
                {group.items.map((item) => {
                  const isChecked = checked.includes(item.id);
                  return (
                    <label className={isChecked ? "is-checked" : ""} key={item.id}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggle(item.id)}
                        disabled={!ready}
                      />
                      <span className="checkmark" aria-hidden="true">✓</span>
                      <span className="check-copy">
                        <strong>{item.label}</strong>
                        {item.detail && <small>{item.detail}</small>}
                      </span>
                    </label>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        <footer className="prep-footer">
          <span>{user ? "체크 상태는 Firebase에 자동 저장됩니다." : "로그인 전에는 이 기기에 임시 저장됩니다."}</span>
          <button type="button" onClick={() => updateChecklist([])} disabled={checked.length === 0 || !ready}>
            전체 해제
          </button>
        </footer>
      </div>
    </section>
  );
}
