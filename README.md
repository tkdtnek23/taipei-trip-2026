# Taipei Trip 2026

2026년 8월 28일부터 31일까지의 타이베이 3박 4일 여행 일정표입니다.

## 주요 기능

- 날짜별 일정과 이동 방법
- Google 지도 장소·구간·전체 경로 링크
- 식사와 카페 추천
- 여행 준비·일정 완료 체크박스와 일정별 메모
- Google 로그인 후 Firebase 기기 간 자동 동기화
- 휴대전화와 데스크톱 반응형 화면

## 로컬 실행

Node.js 22 이상이 필요합니다.

```bash
npm install
npm run dev
```

## 확인 및 GitHub Pages 빌드

```bash
npm test
npm run build:pages
```

`main` 브랜치에 푸시하면 GitHub Actions가 `pages-dist` 결과물을 GitHub Pages에 배포합니다. 저장소의 **Settings → Pages → Source**는 **GitHub Actions**로 설정해야 합니다.

## Firebase

- 프로젝트: `taipei-trip-2026-tkdtnek23`
- 데이터베이스: Cloud Firestore (`asia-east1`)
- 인증: 지정된 Google 관리 계정 1개
- 로그인 전 변경 사항은 현재 기기에 임시 저장되며, 첫 로그인 시 Firestore로 이전됩니다.
- 입장권 바우처처럼 공개하면 안 되는 링크는 Firestore에서만 불러옵니다.

인증 제공업체 또는 Firestore 보안 규칙을 변경한 경우 다음 설정을 배포합니다.

```bash
firebase deploy --only auth,firestore:rules
```
