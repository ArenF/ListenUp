# 🎵 ListenUp!

YouTube 기반 실시간 멀티플레이어 음악 맞추기 게임

[![GitHub Codespaces](https://img.shields.io/badge/GitHub-Codespaces-blue?logo=github)](https://github.com/codespaces)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Svelte](https://img.shields.io/badge/Svelte-5-orange?logo=svelte)](https://svelte.dev/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.8-black?logo=socket.io)](https://socket.io/)

---

## 📋 프로젝트 소개

ListenUp!은 친구들과 함께 음악을 맞추며 경쟁하는 웹 기반 실시간 멀티플레이어 게임입니다.

### ✨ 주요 기능

- 🎮 **로그인 불필요** - 방코드만으로 즉시 플레이
- 🏆 **실시간 순위** - Socket.IO 기반 실시간 점수 및 순위 시스템
- 🎯 **다양한 게임 모드** - 커스텀 플레이리스트 지원
- 💡 **힌트 시스템** - 시간별 자동 힌트 제공
- 🎬 **정답 영상 재생** - 라운드 종료 후 뮤직비디오 자동 재생
- 📊 **풍부한 통계** - 정답률, 연속 정답, 게임 하이라이트
- 🎨 **화려한 애니메이션** - 불꽃놀이, 점수 카운트업, 순위 발표 효과
- ⚙️ **재생 구간 커스터마이징** - 플레이리스트별 재생 구간 설정
- 📱 **반응형 디자인** - 모바일/태블릿/데스크톱 지원

---

## 🎮 게임 플레이

### 1. 방 만들기 / 참가하기
- 호스트가 방을 생성하면 고유한 **방 코드** 발급
- 친구들은 방 코드로 즉시 참가 가능

### 2. 플레이리스트 선택
- 관리자가 미리 구성한 플레이리스트 선택
- 각 플레이리스트는 YouTube 영상으로 구성

### 3. 게임 진행
- 30초간 YouTube 음악 재생 (특정 구간)
- 플레이어들이 곡 제목 입력
- 정답 시 점수 획득 + 연속 정답 보너스

### 4. 힌트 시스템
- 설정된 시간에 자동으로 힌트 표시
- 모든 힌트는 라운드 종료까지 리스트로 유지
- 음량 슬라이더 아래에 위치하여 게임 방해 최소화

### 5. 정답 확인
- 라운드 종료 후 정답 영상 자동 재생
- 플레이어별 정답/오답 실시간 표시
- 네임바 애니메이션 (초록색 = 정답, 빨간색 = 오답)

### 6. 최종 결과
- 🥇🥈🥉 메달과 함께 순위 발표
- 불꽃놀이 효과 (우승자)
- 정답률, 최고 연속 정답 등 상세 통계
- 게임 하이라이트 (최다 정답, 최고 스트릭, 완벽한 플레이어)

---

## 🏗️ 기술 스택

### Frontend
- **Svelte 5** - 최신 rune 문법 (`$state`, `$derived`, `$effect`)
- **TypeScript 5.9** - 완벽한 타입 안전성
- **Socket.IO Client 4.8** - 실시간 양방향 통신
- **Vite 7.2** - 빠른 빌드 및 HMR
- **canvas-confetti** - 불꽃놀이 효과
- **svelte-motion** - 부드러운 애니메이션

### Backend
- **Node.js 20** + Express
- **Socket.IO 4.8** - 실시간 게임 상태 동기화
- **YouTube Data API v3** - 영상 정보 및 재생
- **NodeCache** - API 응답 캐싱 (24시간 TTL)

### 개발 환경
- **GitHub Codespaces** - devcontainer 기반 클라우드 개발
- **npm workspaces** - 모노레포 관리
- **ESLint + Prettier** - 코드 품질 및 포맷팅

---

## 🚀 빠른 시작

### 1. GitHub Codespaces에서 시작하기 (권장)

이 리포지토리는 devcontainer로 구성되어 있습니다.

1. GitHub에서 이 리포지토리를 엽니다
2. **Code** 버튼 → **Codespaces** → **Create codespace on main** 클릭
3. 자동으로 개발 환경이 구성됩니다 (약 2-3분 소요)

devcontainer가 자동으로 다음을 설정합니다:
- ✅ Node.js 20 설치
- ✅ VS Code 확장 설치 (Svelte, ESLint, Prettier)
- ✅ `npm install` 실행
- ✅ 포트 3000(서버), 5173(클라이언트) 포워딩

### 2. YouTube API 설정

게임에 음악을 제공하기 위해 YouTube Data API 키가 필요합니다.

#### YouTube API 키 발급

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. **API 및 서비스 > 라이브러리** 접속
4. "YouTube Data API v3" 검색 및 **사용 설정**
5. **API 및 서비스 > 사용자 인증 정보** 접속
6. **사용자 인증 정보 만들기** → **API 키** 선택
7. API 키 복사

#### 환경변수 설정

```bash
# packages/server 폴더로 이동
cd packages/server

# .env.example을 .env로 복사
cp .env.example .env

# .env 파일을 열어 YouTube API 키 입력
nano .env
```

`packages/server/.env` 파일 내용:

```bash
# YouTube API 키 (필수)
YOUTUBE_API_KEY=여기에_api_key_붙여넣기

# 서버 설정
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

⚠️ **주의**: `.env` 파일은 절대 Git에 커밋하지 마세요!

### 3. 개발 서버 실행

#### 방법 A: 동시 실행 (권장)

```bash
# 루트 디렉토리에서
npm run dev
```

→ 서버(3000)와 클라이언트(5173)가 동시에 실행됩니다.

#### 방법 B: 개별 실행

```bash
# 터미널 1: 서버
npm run dev:server

# 터미널 2: 클라이언트
npm run dev:client
```

### 4. 브라우저에서 확인

Codespaces가 자동으로 포트 5173을 열어줍니다.

- 또는 **PORTS** 탭에서 5173 포트를 클릭하여 접속
- 로컬 개발: `http://localhost:5173`

---

## 📁 프로젝트 구조

```
ListenUp/
├── .devcontainer/
│   └── devcontainer.json          # Codespace 환경 설정
│
├── .claude/                        # Claude Code 설정
│   ├── TODO.md                    # 개발 TODO 목록
│   └── settings.local.json        # 로컬 설정
│
├── docs/                           # 📚 상세 문서 (13개)
│   ├── 게임 시스템 구현 보고서.md
│   ├── UI-UX 실시간 반응 시스템 구현 보고서.md
│   ├── 힌트 시스템 및 플레이리스트 관리 기능 구현 보고서.md
│   ├── 힌트 UX 개선 - 리스트 박스 시스템 구현 보고서.md
│   ├── 게임 결과 화면 개선 기획서.md
│   └── ... (기타 구현 보고서들)
│
├── packages/
│   ├── client/                    # 🎨 Svelte 5 프론트엔드
│   │   ├── src/
│   │   │   ├── lib/
│   │   │   │   ├── components/
│   │   │   │   │   ├── common/          # 공통 컴포넌트
│   │   │   │   │   │   ├── Toast.svelte
│   │   │   │   │   │   ├── HintsContainer.svelte
│   │   │   │   │   │   ├── HintBar.svelte
│   │   │   │   │   │   └── Hint.svelte
│   │   │   │   │   └── game/            # 게임 컴포넌트
│   │   │   │   ├── pages/
│   │   │   │   │   ├── game/            # 게임 페이지
│   │   │   │   │   │   ├── Game.svelte
│   │   │   │   │   │   ├── GameRoom.svelte
│   │   │   │   │   │   ├── GamePlayer.svelte
│   │   │   │   │   │   ├── AnswerPlayer.svelte
│   │   │   │   │   │   └── GameResult.svelte  # ✨ 새로 개선됨
│   │   │   │   │   └── playlist/        # 플레이리스트 관리
│   │   │   │   ├── stores/              # 상태 관리
│   │   │   │   │   ├── gameStore.ts
│   │   │   │   │   └── toastStore.ts
│   │   │   │   ├── utils/               # 유틸리티
│   │   │   │   │   ├── logger.ts        # Logger 시스템
│   │   │   │   │   └── messages.ts      # 메시지 정의
│   │   │   │   └── socket.ts            # Socket.IO 클라이언트
│   │   │   └── App.svelte
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── server/                    # ⚙️ Express 백엔드
│       ├── src/
│       │   ├── services/
│       │   │   ├── youtube.ts           # YouTube API 연동
│       │   │   └── playlist.ts          # 플레이리스트 관리
│       │   ├── socket/
│       │   │   └── handlers/
│       │   │       ├── room.handler.ts
│       │   │       └── game.handler.ts  # 게임 로직
│       │   ├── types/
│       │   │   └── index.ts             # 타입 정의
│       │   ├── data/
│       │   │   └── playlists.json       # 플레이리스트 데이터
│       │   ├── config/
│       │   │   └── env.ts               # 환경 설정
│       │   └── index.ts                 # Express 서버
│       ├── package.json
│       └── tsconfig.json
│
├── .env.example                   # 환경변수 템플릿
├── .gitignore
├── package.json                   # 루트 workspace 설정
├── tsconfig.base.json             # 공통 TypeScript 설정
└── README.md                      # 이 파일
```

---

## 🛠️ 주요 명령어

### 개발

```bash
npm run dev              # 서버 + 클라이언트 동시 실행
npm run dev:server       # 서버만 실행 (포트 3000)
npm run dev:client       # 클라이언트만 실행 (포트 5173)
```

### 빌드

```bash
npm run build            # 전체 빌드 (서버 + 클라이언트)
npm run build:server     # 서버만 빌드 (packages/server/dist)
npm run build:client     # 클라이언트만 빌드 (packages/client/dist)
```

### 정리

```bash
npm run clean            # node_modules 및 빌드 파일 삭제
```

---

## 🎨 주요 구현 기능

### ✅ 완료된 기능 (5개)

#### 1. UI/UX 실시간 반응 시스템 🎨
- 정답 시 네임바 초록색 pulse 애니메이션
- 오답 시 빨간색 shake 애니메이션
- 답안 제출 시 bounce 효과
- 점수 증가 시 +점수 팝업
- 라운드별 정답/오답 상태 지속 표시

**실제 작업 시간**: 3시간 (예상 2-3일)

#### 2. 힌트 시스템 구현 💡
- 백엔드 힌트 타이머 자동 관리
- 그라데이션 배경 힌트 카드
- fade/scale 애니메이션
- 플레이리스트 관리 페이지 UI
- 20개 트랙에 힌트 데이터 추가

**실제 작업 시간**: 4시간 (예상 3-4일)

#### 3. 힌트 UX 개선 - 리스트 박스 시스템 💡
- 중앙 오버레이 → 음량 슬라이더 아래 배치
- 자동 사라지지 않고 라운드 종료까지 유지
- 모든 힌트를 리스트로 동시 확인
- 숫자 이모지로 순서 표시 (①②③)
- 새 힌트 3초간 하이라이트

**실제 작업 시간**: 3시간

#### 4. 비디오 재생 구간 커스터마이징 ⏯️
- PlaylistTrack에 `startSeconds`, `endSeconds` 필드
- YouTube Service에서 커스텀 구간 우선 처리
- 플레이리스트 관리 페이지 UI
- placeholder에 자동 계산 값 표시

**실제 작업 시간**: 2시간 (예상 2-3일)

#### 5. 정답 후 뮤직비디오 재생 🎬
- AnswerPlayer.svelte 컴포넌트
- 자동 재생, 음소거 해제
- 설정된 구간만 재생 (startSeconds ~ endSeconds)
- 게임 플레이어 일시정지/음소거
- 완벽한 에러 처리

**실제 작업 시간**: 3시간 (예상 2-3일)

#### 6. 게임 결과 화면 개선 🏆 (NEW!)
- 🎆 불꽃놀이 효과 (canvas-confetti)
- 📈 점수 카운트업 애니메이션 (Svelte Motion)
- 🥇🥈🥉 메달과 순위 순차 등장
- 📊 풍부한 통계 (정답률, 스트릭, 정답 수)
- ⭐ 게임 하이라이트 (최다 정답, 최고 스트릭, 완벽한 플레이어)
- 🎨 화려한 CSS 애니메이션
- 📱 모바일 반응형 지원

**실제 작업 시간**: 약 4시간 (예상 2-3일)

---

## 📚 문서

상세한 구현 내용은 `docs/` 폴더의 보고서를 참조하세요:

- [게임 시스템 구현 보고서](./docs/게임%20시스템%20구현%20보고서.md)
- [UI-UX 실시간 반응 시스템 구현 보고서](./docs/UI-UX%20실시간%20반응%20시스템%20구현%20보고서.md)
- [힌트 시스템 및 플레이리스트 관리 기능 구현 보고서](./docs/힌트%20시스템%20및%20플레이리스트%20관리%20기능%20구현%20보고서.md)
- [힌트 UX 개선 - 리스트 박스 시스템 구현 보고서](./docs/힌트%20UX%20개선%20-%20리스트%20박스%20시스템%20구현%20보고서.md)
- [게임 결과 화면 개선 기획서](./docs/게임%20결과%20화면%20개선%20기획서.md)
- [Logger 시스템 구현 및 버그 수정 보고서](./docs/Logger%20시스템%20구현%20및%20버그%20수정%20보고서.md)
- [YouTube API 연동 구현 보고서](./docs/YouTube%20API%20연동%20구현%20보고서.md)
- [클라이언트 리팩터링 보고서](./docs/클라이언트%20리팩터링%20보고서.md)
- 기타 보고서들...

개발 TODO는 [.claude/TODO.md](./.claude/TODO.md)를 참조하세요.

---

## 🔧 기술적 특징

### 실시간 통신 (Socket.IO)
- 방 생성/참가 관리
- 게임 상태 실시간 동기화
- 정답/오답 즉시 반영
- 점수 업데이트
- 힌트 자동 전송

### 상태 관리 (Svelte 5)
- `$state` - 반응형 상태
- `$derived` - 계산된 값
- `$effect` - 부수 효과 처리
- Svelte stores (gameStore, toastStore)

### 애니메이션
- CSS Keyframes - 기본 애니메이션
- Svelte Motion - 부드러운 스프링 애니메이션
- canvas-confetti - 불꽃놀이 파티클
- Svelte transitions - fade, slide, fly

### 성능 최적화
- YouTube API 응답 캐싱 (NodeCache, 24시간 TTL)
- 힌트 타이머 메모리 관리
- Set 자료구조로 O(1) 조회
- 반응형 이미지 최적화

---

## 🤝 Git 커밋 컨벤션

```
feat: 새로운 기능 추가
fix: 버그 수정
docs: 문서 수정
style: 코드 포맷팅
refactor: 코드 리팩토링
test: 테스트 코드
chore: 빌드 업무, 패키지 관리

예시:
feat: 게임 결과 화면 개선 (불꽃놀이, 통계)
fix: YouTube Player DOM 재생성 문제 수정
docs: README 업데이트 - 완료 기능 추가
```

---

## 📝 다음 단계

현재 기본 게임 플로우가 완성되었습니다! 다음 개선 사항:

### 우선순위 중간
- [ ] 플레이리스트 미리보기 기능 (재생 구간 테스트)
- [ ] 모바일 반응형 개선 (터치 최적화)

### 우선순위 낮음
- [ ] 접근성 개선 (WCAG 2.1 AA)
- [ ] 다크 모드 지원
- [ ] 통계 대시보드
- [ ] 난이도 설정

자세한 개발 로드맵은 [.claude/TODO.md](./.claude/TODO.md)를 참조하세요.

---

## 🎯 프로젝트 성과

**총 예상 작업 기간**: 7-10일
**실제 작업 시간**: 약 19시간 (2일 반)
**생산성**: 약 **7-10배** 🚀

이러한 놀라운 생산성은 다음 덕분입니다:
- ✨ **Svelte 5의 간결한 문법** - `$state`, `$props` 등
- 🔥 **TypeScript의 타입 안전성** - 버그 조기 발견
- ⚡ **Vite의 빠른 HMR** - 즉각적인 피드백
- 🤖 **Claude Code의 AI 지원** - 효율적인 개발

---

## 📄 라이선스

MIT License

---

## 👥 기여자

**작성자**: ListenUp! Team
**AI 협업**: Claude (Anthropic)

---

**문서 버전**: 2.0
**최종 수정일**: 2025-12-04
**상태**: 활발히 개발 중 🚧
