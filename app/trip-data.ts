export type BookingStatus = "완료" | "불필요" | "선택" | "확정 필요";

export type ScheduleItem = {
  time: string;
  title: string;
  subtitle?: string;
  transport: string;
  booking: BookingStatus;
  cost: string;
  note: string;
  map?: string;
  route?: string;
  links?: { label: string; url?: string; privateKey?: string }[];
  recommendations?: { name: string; map: string }[];
};

export type FoodCard = {
  id: string;
  afterItem?: string;
  slots: { time: string; title: string; detail: string }[];
  recommendations?: { name: string; map: string }[];
};

export type TripDay = {
  id: string;
  day: string;
  date: string;
  weekday: string;
  area: string;
  theme: string;
  color: string;
  dayRoute: string;
  foodCards: FoodCard[];
  items: ScheduleItem[];
};

const mapSearch = (query: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;

const mapDirections = (
  origin: string,
  destination: string,
  travelmode?: "walking" | "transit" | "driving" | "bicycling",
) =>
  `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}${travelmode ? `&travelmode=${travelmode}` : ""}`;

const mapDayRoute = (stops: string[]) => {
  const origin = stops[0];
  const destination = stops[stops.length - 1];
  const waypoints = stops.slice(1, -1).map(encodeURIComponent).join("%7C");

  return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}${waypoints ? `&waypoints=${waypoints}` : ""}`;
};

// 일정 변경 시 아래 배열의 행만 추가·수정하면 표가 자동으로 갱신됩니다.
export const tripDays: TripDay[] = [
  {
    id: "day-1",
    day: "DAY 1",
    date: "08.28",
    weekday: "금요일",
    area: "인천 → 타오위안 → 중정·다퉁",
    theme: "화산1914와 다다오청 노을",
    color: "coral",
    dayRoute: mapDayRoute([
      "Taoyuan International Airport Taiwan",
      "CityInn Hotel Taipei Station Branch II",
      "Huashan 1914 Creative Park",
      "CityInn Hotel Taipei Station Branch II",
      "Dadaocheng Wharf Container Market",
      "CityInn Hotel Taipei Station Branch II",
    ]),
    foodCards: [
      {
        id: "day1-lunch",
        afterItem: "호텔 도착 · 짐 보관",
        slots: [{ time: "13:00", title: "점심", detail: "화산1914 인근 · 입국이 늦으면 간단히" }],
        recommendations: [
          { name: "린양강 해산물(臨洋港)", map: "https://maps.app.goo.gl/k5c3zBeoBD3CxJ5Y6" },
          { name: "금품차루(金品茶樓)", map: "https://maps.app.goo.gl/ZS3JsoUAXfprmrtf9" },
        ],
      },
      {
        id: "day1-dessert",
        afterItem: "화산1914 문화창의산업원구",
        slots: [{ time: "16:00", title: "카페", detail: "다다오청 이동 전 · 시간에 따라 생략" }],
        recommendations: [
          { name: "CHLIV 화산점", map: "https://maps.app.goo.gl/ExgX87av66xRFuJq5" },
        ],
      },
      {
        id: "day1-dinner",
        afterItem: "다다오청 마터우 광장",
        slots: [{ time: "19:00", title: "저녁", detail: "다다오청 마터우 광장 컨테이너 마켓에서" }],
        recommendations: [
          { name: "다다오청 루러우판(大稻埕魯肉飯)", map: "https://maps.app.goo.gl/UsXuTrtyQPmqs2TK6" },
        ],
      },
    ],
    items: [
      {
        time: "05:40",
        title: "공항버스 탑승",
        subtitle: "연원마을(구성역) → 인천공항 T1",
        transport: "예약 공항버스",
        booking: "완료",
        cost: "결제 완료",
        note: "출발 10분 전 정류장 도착. 여권·휴대전화·보조배터리 확인.",
        route: mapDirections("연원마을 버스정류장 용인", "인천국제공항"),
      },
      {
        time: "08:35~10:25",
        title: "아시아나항공 · 인천 → 타이베이",
        subtitle: "ICN 08:35 출발 · TPE 10:25 도착",
        transport: "직항 · 2시간 50분",
        booking: "완료",
        cost: "왕복 2인 709,000원",
        note: "1인 354,500원: 기본요금 191,600원+유류할증료 106,800원+발권대행수수료 10,000원+제세공과금 46,100원. 성인 2인 왕복 총 709,000원 결제 완료. 출도착 시각은 각각 한국·대만 현지시각. 항공편 번호와 인천공항 출발 터미널은 예약 화면에 표시되지 않아 출발 전 아시아나 앱에서 확인.",
      },
      {
        time: "도착 후",
        title: "일반 입국심사 · 수하물",
        subtitle: "TWAC 확인 → 일반 입국심사 → 수하물 → 세관",
        transport: "도보 · 일반 심사대",
        booking: "불필요",
        cost: "무료",
        note: "두 명 함께 일반 입국심사대로 이동. 출발 전 TWAC 제출 완료 여부를 확인하고 심사 시 여권 제시.",
        map: "https://twac.immigration.gov.tw/",
      },
      {
        time: "입국 후",
        title: "이지카드 구매 · 충전",
        subtitle: "공항 MRT역 A12·A13 · 1인 1장",
        transport: "판매·충전기 또는 안내창구",
        booking: "불필요",
        cost: "2인 NT$1,800",
        note: "카드값 1인 NT$100에 사용 잔액은 포함되지 않음. 각자 카드 1장을 구매하고 1인 NT$800씩 충전한 뒤 공항 MRT 개찰구로 이동. 판매·충전기는 현금 사용.",
        map: "https://www.tymetro.com.tw/tymetro-new/en/_pages/travel-guide/usage.php",
      },
      {
        time: "+60~90분",
        title: "공항 MRT → A1 타이베이역",
        subtitle: "T1 A12 · T2 A13에서 Express 탑승",
        transport: "공항 MRT 급행 · 약 35분",
        booking: "불필요",
        cost: "NT$160",
        note: "이지카드는 NT$100에 잔액 별도. 전광판에서 Express/直達車 확인.",
        map: "https://www.tymetro.com.tw/tymetro-new/en/_pages/travel-guide/A1",
        route: mapDirections("Taoyuan International Airport Taiwan", "Airport MRT Taipei Main Station A1", "transit"),
      },
      {
        time: "12:00~13:00",
        title: "호텔 도착 · 짐 보관",
        subtitle: "시티인 호텔 타이베이역 2호점 · 체크인 15:00",
        transport: "A1에서 도보 약 6분 · 400m",
        booking: "완료",
        cost: "무료 보관",
        note: "8/28~8/31 디럭스룸 1실 예약. 15:00 이전 프런트 무료 짐 보관을 호텔이 확인했으므로 짐만 맡기고 바로 외출. CityInn Hotel Taipei Station Branch II / No. 81, Chang'an W. Rd., Datong Dist., Taipei City / 新驛旅店台北車站二館 / 台北市大同區長安西路81號. 09:00~18:00 객실 보수공사로 소음이 발생할 수 있음.",
        map: "https://www.google.com/maps/place//data=!4m2!3m1!1s0x3442a96cfc472f45:0x4b3e9811d8dc0005",
        route: mapDirections("Airport MRT Taipei Main Station A1", "CityInn Hotel Taipei Station Branch II", "walking"),
      },
      {
        time: "14:00",
        title: "화산1914 문화창의산업원구",
        subtitle: "붉은 벽돌 건물·디자인숍·전시",
        transport: "MRT 산다오쓰 또는 중샤오신성 · 도보",
        booking: "불필요",
        cost: "공원 무료 · 전시 별도",
        note: "야외는 24시간, 실내 공간은 대체로 09:30~21:00. 당일 전시를 확인하고 2시간 정도 체류.",
        map: "https://www.huashan1914.com/w/huashan1914/FAQ",
        route: mapDirections("CityInn Hotel Taipei Station Branch II", "Huashan 1914 Creative Park", "transit"),
      },
      {
        time: "16:40",
        title: "호텔 체크인",
        subtitle: "보관한 짐 수령 · 디럭스룸 입실",
        transport: "화산1914에서 MRT 또는 택시",
        booking: "완료",
        cost: "결제 완료",
        note: "프런트에 대표 투숙객과 동일한 여권 및 전자 예약확정서를 제시. 체크인과 짐 정리를 마친 뒤 다다오청으로 이동.",
        map: "https://www.google.com/maps/place//data=!4m2!3m1!1s0x3442a96cfc472f45:0x4b3e9811d8dc0005",
        route: mapDirections("Huashan 1914 Creative Park", "CityInn Hotel Taipei Station Branch II", "transit"),
      },
      {
        time: "17:45",
        title: "다다오청 마터우 광장",
        subtitle: "大稻埕碼頭廣場 · 강변 노을과 컨테이너 마켓",
        transport: "호텔에서 도보 또는 택시",
        booking: "불필요",
        cost: "NT$300~700",
        note: "금요일 운영시간 16:00~22:00. 노을 시간에 맞춰 강변을 걷고 컨테이너 마켓에서 간단히 저녁.",
        map: "https://www.travel.taipei/en/attraction/details/426",
        route: mapDirections("CityInn Hotel Taipei Station Branch II", "Dadaocheng Wharf Container Market"),
      },
      {
        time: "20:30",
        title: "호텔 복귀",
        subtitle: "첫째 날 일정 종료 · 휴식",
        transport: "다다오청에서 도보 또는 택시",
        booking: "불필요",
        cost: "—",
        note: "다음 날 08:10 출발 일정에 맞춰 필요한 물품을 정리하고 휴식.",
        map: "https://www.google.com/maps/place//data=!4m2!3m1!1s0x3442a96cfc472f45:0x4b3e9811d8dc0005",
        route: mapDirections("Dadaocheng Wharf Container Market", "CityInn Hotel Taipei Station Branch II", "walking"),
      },
    ],
  },
  {
    id: "day-2",
    day: "DAY 2",
    date: "08.29",
    weekday: "토요일",
    area: "스린 → 신베이터우 → 젠탄",
    theme: "고궁박물원·베이터우 족욕·스린 야시장",
    color: "blue",
    dayRoute: mapDayRoute([
      "CityInn Hotel Taipei Station Branch II",
      "National Palace Museum Taipei",
      "Beitou Hot Spring Museum",
      "Thermal Valley Taipei",
      "Fuxing Park Hot Spring Foot Spa Taipei",
      "Shilin Night Market",
      "CityInn Hotel Taipei Station Branch II",
    ]),
    foodCards: [
      {
        id: "day2-breakfast",
        slots: [{ time: "07:35", title: "아침", detail: "호텔에서 나와 타이베이역 인근에서 간단히" }],
      },
      {
        id: "day2-lunch",
        afterItem: "고궁박물원 → 신베이터우",
        slots: [{ time: "13:00", title: "점심", detail: "신베이터우 온천공원 인근 · 가벼운 메뉴" }],
        recommendations: [
          { name: "문문푸드 베이터우점(雙月食品社 北投店)", map: "https://maps.app.goo.gl/bQJkWM1uH9XqWgcAA" },
        ],
      },
      {
        id: "day2-dinner",
        afterItem: "스린 야시장",
        slots: [{ time: "18:30", title: "저녁", detail: "스린 야시장 인근에서 선택" }],
        recommendations: [
          { name: "치요우 철판구이 스린점(喫尤平價鐵板燒 士林店)", map: "https://maps.app.goo.gl/jE29EJvZk6qgViug7" },
        ],
      },
    ],
    items: [
      {
        time: "09:45",
        title: "국립고궁박물원 한국어 도슨트 투어",
        subtitle: "B1 손문 동상 반대편 GTS 안내문 앞 · 10:00~12:00",
        transport: "MRT+버스 약 55~65분 · 택시 약 25~35분",
        booking: "완료",
        cost: "2인 총 60,304원 · 수신기 NT$100 별도",
        note: "호텔에서 B1 미팅 장소까지 대중교통은 환승·대기 포함 약 55~65분, 택시는 약 25~35분 예상. 09:15 도착을 목표로 대중교통은 08:10, 택시는 08:35 이전 출발 권장. 8월 29일 10:00 투어 2인·박물관 입장권 2인 구매 완료. 입장권 28,194원+투어 33,800원-쿠폰 1,690원=총 60,304원 결제. 예약확정서·입장권 바우처를 저장하고, 착한투어 피켓을 든 가이드에게 수신기 2인 NT$100만 현금 결제. 09:45 이후에는 기다리지 않고 출발하며 지각 시 중간 합류·환불·시간·날짜 변경 불가. 실내가 서늘하니 얇은 겉옷 준비.",
        map: "https://www.npm.gov.tw/Articles.aspx?l=2&sno=02007001",
        route: mapDirections("CityInn Hotel Taipei Station Branch II", "National Palace Museum Taipei", "transit"),
        links: [
          { label: "투어 상품", url: "https://experiences.myrealtrip.com/products/3481419" },
          { label: "입장권", url: "https://experiences.myrealtrip.com/products/5812458" },
          { label: "바우처", privateKey: "museumVoucher" },
        ],
      },
      {
        time: "12:10",
        title: "고궁박물원 → 신베이터우",
        subtitle: "점심 포함 이동",
        transport: "택시 약 27분 · 9.5km",
        booking: "불필요",
        cost: "택시 현장 확인",
        note: "대중교통보다 시간을 절약해 온천 체류시간을 확보하는 구간.",
        route: mapDirections("National Palace Museum Taipei", "Beitou Hot Spring Museum", "driving"),
      },
      {
        time: "13:45",
        title: "베이터우 온천박물관 · 도서관",
        subtitle: "온천 문화와 목조 건축 산책",
        transport: "도보",
        booking: "불필요",
        cost: "무료",
        note: "온천박물관 토요일 10:00~18:00. 실내 입장 시 신발을 벗는 구역이 있음.",
        map: "https://www.travel.taipei/en/attraction/details/454",
        route: mapDirections("Xinbeitou Station", "Beitou Hot Spring Museum", "walking"),
      },
      {
        time: "14:35",
        title: "지열곡",
        subtitle: "유황 증기 풍경 · 약 30분",
        transport: "온천박물관에서 도보",
        booking: "불필요",
        cost: "무료",
        note: "토요일 09:00~17:00. 증기와 더위가 강하므로 물을 챙기고 안전선 안쪽으로 들어가지 않기.",
        map: "https://www.travel.taipei/en/attraction/details/536?ccms_cs=1",
        route: mapDirections("Beitou Hot Spring Museum", "Thermal Valley Taipei", "walking"),
      },
      {
        time: "15:25",
        title: "푸싱공원 온천 족욕",
        subtitle: "復興公園溫泉泡腳池 · 무료 족욕",
        transport: "지열곡에서 도보 약 20분",
        booking: "불필요",
        cost: "무료",
        note: "화~일 08:00~18:00 운영. 작은 수건을 챙겨 약 30분 족욕하고, 시설 점검에 따른 임시 휴장은 당일 공지를 확인. 마친 뒤 신베이터우역으로 이동.",
        map: "https://www.google.com/maps/search/?api=1&query=Fuxing+Park+Hot+Spring+Foot+Spa+Taipei",
        route: mapDirections("Thermal Valley Taipei", "Fuxing Park Hot Spring Foot Spa Taipei", "walking"),
      },
      {
        time: "16:05",
        title: "베이터우 → 젠탄역",
        subtitle: "신베이터우역에서 베이터우역 환승",
        transport: "도보+MRT 약 40~50분",
        booking: "불필요",
        cost: "이지카드",
        note: "푸싱공원에서 신베이터우역까지 걸은 뒤 홍선으로 이동. 스린 야시장은 스린역보다 젠탄역 1번 출구가 가깝습니다.",
        route: mapDirections("Fuxing Park Hot Spring Foot Spa Taipei", "Shilin Night Market", "transit"),
      },
      {
        time: "17:00",
        title: "스린 야시장",
        subtitle: "시장 골목 산책",
        transport: "젠탄역 1번 출구에서 도보",
        booking: "불필요",
        cost: "현장 선택",
        note: "토요일 16:00~24:00 운영. 사람이 몰리기 전 이른 시간에 둘러보고, 혼잡한 골목에서는 소지품에 주의하기.",
        map: "https://travel.taipei/en/attraction/details/1692",
      },
      {
        time: "20:00",
        title: "호텔 복귀",
        subtitle: "젠탄역 → 타이베이역 → 시티인 호텔",
        transport: "MRT 홍선+도보 약 25분",
        booking: "불필요",
        cost: "이지카드",
        note: "다음 날 일정에 대비해 20시대에 복귀. 야시장에서 구입한 음식은 포장 상태와 호텔 반입 가능 여부 확인.",
        route: mapDirections("Shilin Night Market", "CityInn Hotel Taipei Station Branch II", "transit"),
      },
    ],
  },
  {
    id: "day-3",
    day: "DAY 3",
    date: "08.30",
    weekday: "일요일",
    area: "동먼·융캉 → 송산문화공원 → 신이 → 타이베이역",
    theme: "도심 산책과 101 야경",
    color: "gold",
    dayRoute: mapDayRoute([
      "CityInn Hotel Taipei Station Branch II",
      "Yongkang Street Taipei",
      "Songshan Cultural and Creative Park",
      "Xiangshan Station Taipei",
      "Xiangshan Six Boulders Taipei",
      "CityInn Hotel Taipei Station Branch II",
    ]),
    foodCards: [
      {
        id: "day3-breakfast",
        slots: [{ time: "09:10", title: "아침", detail: "호텔 인근에서 식사" }],
      },
      {
        id: "day3-lunch",
        afterItem: "동먼 · 융캉제 산책",
        slots: [{ time: "12:30", title: "점심", detail: "동먼·융캉제에서 새로운 식당 선택" }],
        recommendations: [
          { name: "하오공다오 진지위안(好公道金雞園)", map: "https://maps.app.goo.gl/g7mPRynebmzR9dmv7" },
          { name: "딘타이펑 신생점(鼎泰豐)", map: "https://maps.app.goo.gl/rexQe3o8Dxn6GV4YA" },
        ],
      },
      {
        id: "day3-dessert",
        afterItem: "동먼 · 융캉제 산책",
        slots: [{ time: "14:10", title: "카페", detail: "송산 이동 전 · 대기 길면 생략" }],
        recommendations: [
          { name: "라뜰리에 로터스(L’Atelier Lotus)", map: "https://maps.app.goo.gl/LCqj8BoYBYqJdbDZ8" },
        ],
      },
      {
        id: "day3-dinner",
        afterItem: "샹산에서 101 야경",
        slots: [{ time: "20:00", title: "저녁", detail: "샹산 하산 후 식사 후보 선택" }],
        recommendations: [
          { name: "핀두 꼬치구이(品都串燒)", map: "https://maps.app.goo.gl/QZQuZLeTpA1QvDzN9" },
        ],
      },
    ],
    items: [
      {
        time: "10:30",
        title: "동먼 · 융캉제 산책",
        subtitle: "동먼역을 중심으로 골목 상점·식당·카페",
        transport: "MRT 동먼역 · 도보",
        booking: "선택",
        cost: "식사·쇼핑 별도",
        note: "골목 상점과 주변을 천천히 둘러본 뒤 12:30쯤 점심 식사.",
        map: mapSearch("Yongkang Street Taipei"),
        route: mapDirections("CityInn Hotel Taipei Station Branch II", "Yongkang Street Taipei", "transit"),
      },
      {
        time: "15:00",
        title: "송산문화창의공원",
        subtitle: "松山文創園區 · 옛 담배공장·디자인숍·전시",
        transport: "동먼에서 MRT 또는 택시",
        booking: "불필요",
        cost: "공원 무료 · 전시 별도",
        note: "공원은 08:00~22:00, 실내 시설과 상점은 개별 운영시간 확인. 17시까지 둘러본 뒤 샹산으로 이동.",
        map: "https://www.songshanculturalpark.org/english",
        route: mapDirections("Yongkang Street Taipei", "Songshan Cultural and Creative Park", "transit"),
      },
      {
        time: "17:20",
        title: "샹산 등산로 이동",
        subtitle: "타이베이101 전망대 대신 선택한 야경 포인트",
        transport: "MRT 샹산역 2번 출구 · 도보",
        booking: "불필요",
        cost: "무료",
        note: "일몰 50~60분 전에 등산 시작. 공식 전체 코스는 약 1시간 40분이므로 체력에 따라 육거석 전망대까지만 왕복.",
        map: "https://www.travel.taipei/en/attraction/details/564",
        route: mapDirections("Songshan Cultural and Creative Park", "Xiangshan Station Taipei", "transit"),
      },
      {
        time: "18:20",
        title: "샹산에서 101 야경",
        subtitle: "육거석 또는 중간 전망대",
        transport: "계단·도보",
        booking: "불필요",
        cost: "무료",
        note: "비가 오거나 노면이 젖으면 생략. 미끄럼 방지 신발과 휴대용 조명 준비.",
        map: mapSearch("Xiangshan Six Boulders Taipei"),
        route: mapDirections("Xiangshan Station Taipei", "Xiangshan Six Boulders Taipei", "walking"),
      },
      {
        time: "21:30",
        title: "호텔 복귀",
        subtitle: "저녁 식사 후 시티인 호텔로",
        transport: "MRT 또는 택시 약 25~40분",
        booking: "불필요",
        cost: "이지카드 또는 택시비",
        note: "선택한 식당에서 식사를 마친 뒤 호텔로 이동.",
        links: [
          { label: "핀두→호텔", url: mapDirections("25.041614,121.55532", "CityInn Hotel Taipei Station Branch II", "transit") },
        ],
      },
    ],
  },
  {
    id: "day-4",
    day: "DAY 4",
    date: "08.31",
    weekday: "월요일",
    area: "중산·츠펑 → 타이베이역 → 타오위안",
    theme: "여유 있는 출국일",
    color: "green",
    dayRoute: mapDayRoute([
      "CityInn Hotel Taipei Station Branch II",
      "Chifeng Street Taipei",
      "CityInn Hotel Taipei Station Branch II",
      "Airport MRT Taipei Main Station A1",
      "Taoyuan International Airport Terminal 2",
    ]),
    foodCards: [
      {
        id: "day4-breakfast",
        slots: [{ time: "09:00", title: "아침", detail: "호텔·중산 인근에서 가볍게 식사" }],
      },
      {
        id: "day4-airport-meal",
        afterItem: "A1 → 타오위안공항",
        slots: [{ time: "14:00~14:40", title: "점심", detail: "체크인·출국심사 후 타오위안공항 내 우육면 가게" }],
        recommendations: [
          {
            name: "라오장 칭전 우육면관(烙張清真牛肉麵館) · 제2터미널 C3 부근",
            map: mapSearch("烙張清真牛肉麵館 桃園機場第二航廈"),
          },
        ],
      },
    ],
    items: [
      {
        time: "10:00",
        title: "중산 · 츠펑제 산책",
        subtitle: "체크아웃 전 마지막 골목 산책",
        transport: "호텔에서 도보",
        booking: "불필요",
        cost: "쇼핑 별도",
        note: "가볍게 둘러본 뒤 11:20까지 호텔로 돌아와 객실의 캐리어를 수령.",
        map: mapSearch("Chifeng Street Taipei"),
        route: mapDirections("CityInn Hotel Taipei Station Branch II", "Chifeng Street Taipei", "walking"),
      },
      {
        time: "11:30~12:15",
        title: "호텔 체크아웃 → A1역",
        subtitle: "객실에서 캐리어 수령 후 공항 MRT로 이동",
        transport: "체크아웃 · 도보 약 6분",
        booking: "불필요",
        cost: "—",
        note: "11:30에 체크아웃하고 캐리어를 챙긴 뒤 12:15까지 Airport MRT A1역으로 이동. Google 지도 목적지는 일반 타이베이역이 아닌 A1역으로 확인.",
        route: mapDirections("CityInn Hotel Taipei Station Branch II", "Airport MRT Taipei Main Station A1", "walking"),
      },
      {
        time: "12:45",
        title: "A1 → 타오위안공항",
        subtitle: "13:20경 공항 도착 목표",
        transport: "공항 MRT 급행 · 약 35분",
        booking: "불필요",
        cost: "NT$160",
        note: "16:55 출발편보다 약 3시간 30분 일찍 도착하는 일정. 이용 터미널과 체크인 카운터는 당일 아시아나 앱에서 최종 확인.",
        route: mapDirections("Airport MRT Taipei Main Station A1", "Taoyuan International Airport Taiwan", "transit"),
      },
      {
        time: "16:55~20:25",
        title: "아시아나항공 · 타이베이 → 인천",
        subtitle: "TPE 16:55 출발 · ICN 20:25 도착",
        transport: "직항 · 2시간 30분",
        booking: "완료",
        cost: "왕복 결제에 포함",
        note: "출도착 시각은 각각 대만·한국 현지시각. 항공편 번호와 타오위안공항 이용 터미널은 출발 전 확인하고, 인천 도착 후 예약 공항버스 탑승시간 점검.",
      },
      {
        time: "도착 후",
        title: "공항버스 탑승",
        subtitle: "인천공항 → 연원마을(구성역)",
        transport: "귀국편 기내에서 예약",
        booking: "필수",
        cost: "결제 예정",
        note: "귀국편 비행기 안에서 공항버스 예약 필수. 입국심사와 수하물 수령 후 예약한 탑승시간과 승차장을 확인.",
        route: mapDirections("인천국제공항", "연원마을 버스정류장 용인", "transit"),
      },
    ],
  },
];

export const tripInfo = {
  title: "대만 타이베이 3박 4일",
  dates: "2026.08.28 — 08.31",
  hotel: "시티인 호텔 타이베이역 2호점",
  hotelAddress: "台北市大同區長安西路81號",
};
