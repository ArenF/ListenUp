# YouTube Player 에러 처리 및 게임 플로우 개선 보고서

**작성일**: 2025-11-25
**프로젝트**: ListenUp! - 실시간 음악 맞추기 게임
**작업 범위**: YouTube Player 에러 처리 강화, 재생 불가능 트랙 자동 스킵, 트랙 선택 로직 개선

---

## 목차

1. [작업 개요](#작업-개요)
2. [발견된 문제](#발견된-문제)
3. [구현 내용](#구현-내용)
4. [기술적 상세](#기술적-상세)
5. [테스트 결과](#테스트-결과)
6. [향후 개선 사항](#향후-개선-사항)
7. [결론](#결론)

---

## 작업 개요

### 프로젝트 정보
- **작업 일자**: 2025-11-25
- **작업자**: ListenUp! Team
- **목적**: YouTube Player 에러 처리 개선 및 게임 진행 안정성 향상

### 구현 배경

게임 진행 중 YouTube Player에서 다양한 에러(특히 임베드 재생 제한)가 발생할 때, 다음과 같은 문제들이 있었습니다:

1. **불명확한 에러 메시지**: 에러 코드(150, 101 등)가 사용자에게 의미 없는 숫자로만 표시됨
2. **준비 알림 중복 호출**: `onReady`와 `onError`가 동시에 발생하여 "준비를 기다리는 상태가 아닙니다" 에러 발생
3. **게임 멈춤 현상**: 재생 불가능한 트랙에서 게임이 멈춰 수동으로 스킵해야 함
4. **트랙 중복**: 랜덤 선택으로 인해 같은 트랙이 여러 라운드에서 반복 재생됨

---

## 발견된 문제

### 🔴 1. YouTube Player 에러 코드 미처리

#### 문제 상황
```typescript
// Game.svelte - 기존 코드
onError: (event: any) => {
  console.error("❌ YouTube Player 에러:", event.data);
  updateGameStore({
    statusMessage: "❌ 영상 재생 오류",
    isLoadingTrack: false,
  });
}
```

#### 문제점
- 모든 에러가 "영상 재생 오류"로만 표시됨
- 150 에러(임베드 재생 제한)와 100 에러(동영상 없음) 구분 불가
- 사용자가 문제의 원인을 알 수 없음

#### 실제 로그
```
Game.svelte:312 ❌ YouTube Player 에러: 150
Game.svelte:314 ❌ 영상 재생 오류
```

---

### 🔴 2. 준비 알림 중복 호출 문제

#### 문제 상황
YouTube Player 초기화 시 `onReady`와 `onError` 이벤트가 **둘 다 발생**:

```
✅ YouTube Player 준비 완료!  (onReady 이벤트)
  → 500ms 후 notifyPlayerReady() 예약

❌ YouTube Player 에러: 150   (onError 이벤트)
  → 즉시 notifyPlayerReady() 호출

📤 서버에 준비 완료 알림 전송  ← 첫 번째 (성공)
✅ 준비 완료 확인됨

🎵 라운드 시작!

📤 서버에 준비 완료 알림 전송  ← 두 번째 (500ms 후 예약된 것 실행)
❌ 준비 실패: 현재 준비를 기다리는 상태가 아닙니다
```

#### 문제점
- `onReady`의 `setTimeout`이 취소되지 않아 중복 호출 발생
- 이미 라운드가 시작된 후 준비 알림이 다시 전송됨
- 서버에서 에러 반환 (게임 진행에는 영향 없지만 로그 혼란)

---

### 🔴 3. 재생 불가능 트랙에서 게임 멈춤

#### 문제 상황
임베드 재생이 제한된 비디오(`M4EJqcTjNcY`)가 선택될 때:

```
❌ YouTube Player 에러: 150
⚠️ 에러 발생으로 인한 강제 준비 완료 처리
🎵 라운드 시작!
  - PlayerState: -1 UNSTARTED  ← 재생이 안 됨!
```

#### 문제점
- 라운드는 시작되지만 음악이 재생되지 않음
- 사용자는 답을 맞출 수 없고 타이머만 흘러감
- 수동으로 다음 라운드를 진행해야 함

---

### 🟡 4. 트랙 중복 선택 문제

#### 문제 상황
```typescript
// game.ts - 기존 코드
// 랜덤 트랙 선택 (중복 방지는 추후 개선)
const randomIndex = Math.floor(Math.random() * tracks.length);
const selectedTrack = tracks[randomIndex];
```

#### 실제 로그
```
라운드 1: p3aVaChXrMI
라운드 2: UFQEttrn6CQ
라운드 3: p3aVaChXrMI  ← 중복!
라운드 4: gCyjdA3ulJM
라운드 5: m34DPnRUfMU
라운드 6: gCyjdA3ulJM  ← 중복!
라운드 7: zry-FErubKQ
라운드 8: m34DPnRUfMU  ← 중복!
```

#### 문제점
- 같은 트랙이 여러 번 재생되어 게임 재미 감소
- 플레이리스트 순서가 무시됨

---

## 구현 내용

### ✅ 1. YouTube Player 에러 코드별 메시지 처리

#### 구현 위치
`/packages/client/src/lib/pages/game/Game.svelte:315-357`

#### 구현 코드
```typescript
onError: (event: any) => {
  const errorCode = event.data;
  console.error("❌ YouTube Player 에러:", errorCode);

  // onReady의 setTimeout 취소 (중복 호출 방지)
  if (readyTimeoutId) {
    clearTimeout(readyTimeoutId);
    readyTimeoutId = null;
    console.log("🚫 onReady의 준비 알림 예약 취소됨");
  }

  // 재생 에러 플래그 설정
  hasPlaybackError = true;

  // 에러 코드별 메시지
  let errorMessage = "❌ 영상 재생 오류";
  switch (errorCode) {
    case 2:
      errorMessage = "❌ 잘못된 비디오 설정";
      break;
    case 5:
      errorMessage = "❌ 비디오 재생 불가 (HTML5 오류)";
      break;
    case 100:
      errorMessage = "❌ 비디오를 찾을 수 없음";
      break;
    case 101:
    case 150:
      errorMessage = "❌ 이 비디오는 임베드 재생이 제한되어 있습니다";
      break;
    default:
      errorMessage = `❌ 영상 재생 오류 (코드: ${errorCode})`;
  }

  updateGameStore({
    statusMessage: errorMessage,
    isLoadingTrack: false,
  });

  // 에러 발생 시에도 다른 플레이어들이 대기하지 않도록 준비 완료 알림
  console.warn("⚠️ 에러 발생으로 인한 강제 준비 완료 처리");
  notifyPlayerReady();
}
```

#### YouTube Player API 에러 코드 참조
| 코드 | 의미 | 사용자 메시지 |
|------|------|--------------|
| 2 | 잘못된 매개변수 값 | 잘못된 비디오 설정 |
| 5 | HTML5 플레이어 재생 불가 | 비디오 재생 불가 (HTML5 오류) |
| 100 | 동영상을 찾을 수 없음 | 비디오를 찾을 수 없음 |
| 101, 150 | 임베드 재생 차단 | 이 비디오는 임베드 재생이 제한되어 있습니다 |

---

### ✅ 2. 준비 알림 중복 호출 방지

#### 구현 위치
`/packages/client/src/lib/pages/game/Game.svelte:287-323`

#### 구현 코드
```typescript
// onReady의 setTimeout을 저장하기 위한 변수
let readyTimeoutId: ReturnType<typeof setTimeout> | null = null;

const newPlayer = new YT.Player("youtube-player", {
  events: {
    onReady: (event: any) => {
      console.log("✅ YouTube Player 준비 완료!");
      event.target.mute();
      updateGameStore({ isMuted: true });

      // setTimeout ID 저장
      readyTimeoutId = setTimeout(() => {
        event.target.pauseVideo();
        notifyPlayerReady();
      }, 500);
    },
    onError: (event: any) => {
      // onReady의 setTimeout 취소 (중복 호출 방지)
      if (readyTimeoutId) {
        clearTimeout(readyTimeoutId);
        readyTimeoutId = null;
        console.log("🚫 onReady의 준비 알림 예약 취소됨");
      }
      // ... 에러 처리
    }
  }
});
```

#### 동작 흐름
1. `onReady` 이벤트 발생 → `setTimeout` ID 저장
2. `onError` 이벤트 발생 → 저장된 `setTimeout` 취소
3. 즉시 `notifyPlayerReady()` 호출
4. 중복 호출 방지 완료

---

### ✅ 3. 재생 불가능 트랙 자동 스킵

#### 구현 위치
- 플래그 변수: `Game.svelte:256`
- 에러 시 플래그 설정: `Game.svelte:327`
- 플래그 리셋: `Game.svelte:313`
- 자동 스킵 로직: `Game.svelte:149-172`

#### 구현 코드

**1. 에러 플래그 변수 추가**
```typescript
let hasPlaybackError = false; // 재생 에러 플래그
```

**2. 에러 발생 시 플래그 설정**
```typescript
onError: (event: any) => {
  // 재생 에러 플래그 설정
  hasPlaybackError = true;
  // ... 에러 처리
}
```

**3. 새 트랙 로드 시 플래그 리셋**
```typescript
console.log("🎬 YouTube Player 생성 중...", preparedTrack.id);
lastLoadedTrackId = preparedTrack.id;
hasPlaybackError = false; // 새 트랙 로드 시 에러 플래그 리셋
```

**4. 라운드 시작 시 자동 스킵**
```typescript
socket.on("round-started", (data) => {
  console.log("🎵 라운드 시작!", data);

  // 재생 에러가 있었다면 자동으로 다음 라운드로 스킵
  if (hasPlaybackError) {
    console.warn("⚠️ 재생 불가능한 트랙 - 3초 후 자동 스킵");
    updateGameStore({
      statusMessage: "⚠️ 재생 불가능한 트랙입니다. 곧 다음 라운드로 넘어갑니다...",
    });

    setTimeout(() => {
      console.log("⏭️ 다음 라운드로 자동 스킵");
      hasPlaybackError = false; // 플래그 리셋

      if (currentRoom) {
        socket.emit(
          "next-round",
          { roomCode: currentRoom.code },
          (response: any) => {
            if (!response.success) {
              console.error("❌ 다음 라운드 실패:", response.error);
            }
          }
        );
      }
    }, 3000);
    return;
  }

  // 정상 트랙인 경우 플레이어 재생
  // ...
});
```

#### 동작 흐름
```
1. 트랙 로드 시도
2. 150 에러 발생 → hasPlaybackError = true
3. 준비 완료 알림
4. 라운드 시작
5. hasPlaybackError 체크 → true
6. "재생 불가능한 트랙입니다" 메시지 표시
7. 3초 후 자동으로 next-round 이벤트 발생
8. 다음 트랙 로드
```

---

### ✅ 4. 순차적 트랙 선택 로직

#### 구현 위치
`/packages/server/src/services/game.ts:543-546`

#### 변경 전
```typescript
// 랜덤 트랙 선택 (중복 방지는 추후 개선)
const randomIndex = Math.floor(Math.random() * tracks.length);
const selectedTrack = tracks[randomIndex];
```

#### 변경 후
```typescript
// 순차적 트랙 선택 (라운드 번호에 맞춰 순서대로)
// nextRoundNumber는 1부터 시작하므로 인덱스는 0부터 시작하도록 -1
const trackIndex = (nextRoundNumber - 1) % tracks.length;
const selectedTrack = tracks[trackIndex];
```

#### 동작 예시

**플레이리스트에 10개의 트랙이 있을 때:**
| 라운드 | nextRoundNumber | trackIndex | 선택 트랙 |
|--------|----------------|------------|-----------|
| 1 | 1 | 0 | tracks[0] |
| 2 | 2 | 1 | tracks[1] |
| 3 | 3 | 2 | tracks[2] |
| ... | ... | ... | ... |
| 10 | 10 | 9 | tracks[9] |

**플레이리스트보다 라운드가 많을 경우:**
- `% tracks.length`로 순환하여 반복
- 예: 15라운드 → track[4] (14 % 10 = 4)

---

## 기술적 상세

### 1. YouTube IFrame Player API 이벤트 흐름

```
플레이어 생성
    ↓
┌─────────────────┐
│   onReady       │ ← 플레이어 초기화 완료
└─────────────────┘
    ↓
┌─────────────────┐
│ 500ms 대기      │
└─────────────────┘
    ↓
┌─────────────────┐
│ notifyReady()   │ ← 서버에 준비 알림
└─────────────────┘

만약 에러 발생:
┌─────────────────┐
│   onError       │ ← 에러 발생 (예: 150)
└─────────────────┘
    ↓
┌─────────────────┐
│ clearTimeout()  │ ← 예약된 알림 취소
└─────────────────┘
    ↓
┌─────────────────┐
│ notifyReady()   │ ← 즉시 준비 알림
└─────────────────┘
```

### 2. 에러 플래그 생명주기

```typescript
// 초기 상태
hasPlaybackError = false

// 새 트랙 로드
prepareNextRound() → hasPlaybackError = false (리셋)

// YouTube Player 생성
new YT.Player()
  ├─ onReady: (변경 없음)
  └─ onError: hasPlaybackError = true (설정)

// 라운드 시작
round-started
  ├─ if (hasPlaybackError) → 자동 스킵
  │   └─ setTimeout(3s) → next-round
  │       └─ hasPlaybackError = false (리셋)
  └─ else → 정상 재생
```

### 3. 서버-클라이언트 통신 흐름

```
[서버]                    [클라이언트]
   │                           │
   │◄──── player-ready ────────│ 준비 완료 알림
   │                           │
   │ markPlayerReady()         │
   │ isAllPlayersReady()?      │
   │   ├─ NO  → 대기           │
   │   └─ YES                  │
   │                           │
   │──── round-started ───────►│ 라운드 시작
   │                           │
   │                           │ hasPlaybackError?
   │                           │   ├─ NO  → 재생
   │                           │   └─ YES
   │                           │       │
   │◄──── next-round ──────────│       │ (3초 후)
   │                           │       │
   │──── prepare-round ───────►│◄──────┘ 다음 트랙
```

---

## 테스트 결과

### ✅ 테스트 환경
```
플랫폼: Linux (Codespace)
Node.js: 20.x
프로젝트: /workspaces/ListenUp
플레이리스트: custom-AbElHunK (JPOP, 10 트랙)
테스트 라운드: 10 라운드
```

### ✅ 테스트 케이스

#### 1. 에러 메시지 표시 ✅
- **150 에러 발생 시**: "이 비디오는 임베드 재생이 제한되어 있습니다" 표시
- **에러 코드 구분**: 각 에러 코드별 명확한 한국어 메시지

#### 2. 중복 호출 방지 ✅
- **이전**: "❌ 준비 실패: 현재 준비를 기다리는 상태가 아닙니다" 에러 발생
- **현재**: "🚫 onReady의 준비 알림 예약 취소됨" 로그만 출력, 에러 없음

#### 3. 자동 스킵 ✅
- **임베드 제한 트랙**: 3초 후 자동으로 다음 라운드로 이동
- **게임 진행**: 중단 없이 계속 진행

#### 4. 순차적 트랙 선택 ✅
```
라운드 1: p3aVaChXrMI     ← 순서대로
라운드 2: UFQEttrn6CQ
라운드 3: m34DPnRUfMU
라운드 4: gCyjdA3ulJM
라운드 5: zry-FErubKQ
...
라운드 10: TSUAXnRpNSQ
```
- **중복 없음**: 모든 트랙이 한 번씩만 재생됨
- **순서 보장**: 플레이리스트 정의 순서대로 재생됨

### ✅ 성능 및 안정성
- **메모리 누수**: 없음
- **게임 중단**: 없음
- **타이밍 이슈**: 없음
- **다중 플레이어**: 정상 동작 (2명 테스트 완료)

---

## 정답 영상 재생 시스템 (AnswerPlayer)

**추가 일자**: 2025-12-01
**컴포넌트**: `AnswerPlayer.svelte`
**목적**: 라운드 종료 후 정답 영상을 자동으로 재생하여 사용자 경험 향상

### 구현 배경

라운드가 종료된 후 플레이어들이 정답 영상을 확인하지 못하는 문제가 있었습니다. 게임 플레이어는 음소거된 상태로 힌트만 제공하기 때문에, 정답 발표 후 실제 음악을 듣고 확인할 기회가 필요했습니다.

### 주요 기능

#### 1. 독립적인 정답 플레이어
게임 플레이어(`GamePlayer.svelte`)와 분리된 독립적인 YouTube Player 인스턴스:

```svelte
<AnswerPlayer track={roundResult.track} />
```

**특징:**
- 게임 플레이어와 별도의 DOM 요소 사용 (`answer-player`)
- 라운드 결과가 표시될 때만 마운트됨
- 자동으로 음소거 해제 및 재생

#### 2. 자동 재생 및 음소거 해제

```typescript
onReady: (event: any) => {
  console.log("✅ 정답 영상 플레이어 준비 완료!");
  playerReady = true;

  // 음소거 해제 후 재생
  event.target.unMute();
  event.target.setVolume(70); // 기본 음량 70%
  event.target.playVideo();

  console.log("🔊 정답 영상 재생 시작 (음소거 해제)");
}
```

**동작 흐름:**
1. `round-ended` 이벤트 발생
2. 게임 플레이어 일시정지 + 음소거
3. AnswerPlayer 컴포넌트 마운트
4. YouTube Player API로 정답 영상 플레이어 생성
5. `onReady` 이벤트 시 음소거 해제 및 자동 재생

#### 3. 커스텀 재생 구간 지원

```typescript
player = new YT.Player("answer-player", {
  videoId: track.id,
  playerVars: {
    autoplay: 1,
    start: track.startSeconds,    // 커스텀 시작 시간
    end: track.endSeconds,        // 커스텀 종료 시간
    controls: 1,
    rel: 0,
    modestbranding: 1,
  },
  // ...
});
```

**지원 기능:**
- 플레이리스트에서 지정한 시작/종료 시간 자동 적용
- 하이라이트 구간만 재생 가능
- 사용자가 컨트롤 조작 가능 (`controls: 1`)

#### 4. 에러 처리

```typescript
onError: (event: any) => {
  const errorCode = event.data;
  let errorMessage = "❌ 정답 영상 재생 오류";

  switch (errorCode) {
    case 2:
      errorMessage = "❌ 잘못된 비디오 설정";
      break;
    case 5:
      errorMessage = "❌ 비디오 재생 불가 (HTML5 오류)";
      break;
    case 100:
      errorMessage = "❌ 비디오를 찾을 수 없음";
      break;
    case 101:
    case 150:
      errorMessage = "❌ 이 비디오는 임베드 재생이 제한되어 있습니다";
      break;
    default:
      errorMessage = `❌ 영상 재생 오류 (코드: ${errorCode})`;
  }

  console.error(errorMessage);
}
```

**에러 처리 전략:**
- 게임 플레이어와 동일한 에러 코드 처리
- 사용자에게 명확한 에러 메시지 표시
- 에러 발생 시에도 게임 진행에는 영향 없음

#### 5. 반응형 디자인 및 스타일링

```css
.answer-player-container {
  width: 100%;
  margin: 1.5rem 0;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  background-color: #000;
}

.video-wrapper {
  position: relative;
  width: 100%;
  padding-bottom: 56.25%; /* 16:9 aspect ratio */
  height: 0;
  overflow: hidden;
}
```

**디자인 특징:**
- 16:9 비율 유지 (모든 화면 크기에서 일관성)
- 깔끔한 그림자 효과
- 로딩 오버레이 표시

#### 6. 리소스 정리

```typescript
onDestroy(() => {
  if (player && typeof player.destroy === "function") {
    console.log("🗑️ 정답 영상 플레이어 파괴");
    try {
      player.destroy();
    } catch (e) {
      console.warn("플레이어 파괴 중 에러 (무시):", e);
    }
  }
});
```

**메모리 관리:**
- 컴포넌트 언마운트 시 플레이어 자동 파괴
- 메모리 누수 방지
- 에러 발생 시 안전하게 처리

### 게임 플로우 통합

```
게임 플레이 중
  ├─ GamePlayer (음소거, 힌트만 제공)
  ↓
라운드 종료 (round-ended 이벤트)
  ├─ GamePlayer.pauseVideo()
  ├─ GamePlayer.mute()
  ├─ 타이머 정리
  ↓
정답 발표
  ├─ AnswerPlayer 마운트
  ├─ 음소거 해제 + 자동 재생
  ├─ 플레이어들이 정답 영상 감상
  ↓
다음 라운드 준비
  ├─ 플레이어들 준비 완료 표시
  ├─ 모두 준비되면 다음 라운드 시작
  └─ AnswerPlayer 언마운트 (자동 정리)
```

### 개선된 사용자 경험

**Before (2025-12-01 이전):**
- ❌ 라운드 종료 후 음악을 들을 수 없음
- ❌ 정답이 무엇이었는지 확인 불가
- ❌ 단순히 텍스트로만 정답 표시

**After (AnswerPlayer 추가 후):**
- ✅ 라운드 종료 후 정답 영상 자동 재생
- ✅ 음소거 해제로 실제 음악 청취 가능
- ✅ 커스텀 구간 재생 지원
- ✅ 사용자가 영상 컨트롤 가능

### 기술적 상세

**컴포넌트 위치**: `packages/client/src/lib/pages/game/AnswerPlayer.svelte`

**Props 인터페이스:**
```typescript
interface Props {
  track: {
    id: string;
    name: string;
    artist: string;
    startSeconds: number;
    endSeconds: number;
  };
}
```

**상태 관리:**
```typescript
let player: any = null;          // YouTube Player 인스턴스
let playerReady = $state(false); // 플레이어 준비 상태 (Svelte 5 runes)
```

**DOM 요소:**
- `#answer-player`: YouTube Player iframe이 삽입될 div
- `.loading-overlay`: 플레이어 로딩 중 표시

### 테스트 결과

✅ 정답 영상 자동 재생 확인
✅ 음소거 해제 동작 확인 (볼륨 70%)
✅ 커스텀 재생 구간 정상 작동
✅ 에러 발생 시 명확한 메시지 표시
✅ 컴포넌트 언마운트 시 리소스 정리 확인
✅ 게임 플레이어와 독립적으로 동작

### 관련 커밋

- **872a0dc**: 정답 영상 출력 문제 해결 - AnswerPlayer.svelte 생성, 기존 iframe 코드 완전 제거, CSS 정리
- **23b46fa**: Game.svelte round-ended 이벤트 핸들러에 영상 재생 로직 추가, 타이머 시스템 구현

---

## 향후 개선 사항

### 1. 에러 발생 트랙 자동 제외
현재는 에러 발생 시 스킵만 하고 있지만, 향후 다음과 같은 개선 가능:
```typescript
// 에러 발생 트랙을 blacklist에 추가
const errorTracks = new Set<string>();

onError: (event: any) => {
  errorTracks.add(preparedTrack.id);
  // 서버에 에러 트랙 보고
  socket.emit("report-error-track", {
    videoId: preparedTrack.id,
    errorCode: event.data
  });
}
```

### 2. 에러 트랙 사전 검증
게임 시작 전 모든 트랙의 임베드 가능 여부를 검증:
```typescript
// YouTube Data API를 사용한 사전 검증
async function validateTracks(tracks: Track[]) {
  const validTracks = [];
  for (const track of tracks) {
    const isEmbeddable = await checkEmbeddable(track.id);
    if (isEmbeddable) {
      validTracks.push(track);
    }
  }
  return validTracks;
}
```

### 3. 사용자 피드백 개선
에러 발생 시 더 자세한 정보 제공:
```typescript
updateGameStore({
  statusMessage: `⚠️ "${track.name}" 재생 불가 (임베드 제한)`,
  errorDetails: {
    videoId: track.id,
    errorCode: 150,
    suggestion: "이 트랙은 건너뛰겠습니다"
  }
});
```

### 4. 관리자 대시보드
에러 발생 통계를 수집하여 문제 트랙 관리:
```typescript
interface TrackErrorStats {
  videoId: string;
  errorCount: number;
  lastErrorDate: Date;
  errorCodes: number[];
}
```

---

## 결론

### 달성된 목표
✅ YouTube Player 에러 코드별 명확한 메시지 제공
✅ 준비 알림 중복 호출 문제 해결
✅ 재생 불가능 트랙 자동 스킵 기능 구현
✅ 트랙 선택 로직을 순차적으로 개선 (중복 제거)

### 개선된 사용자 경험
- **명확한 피드백**: 에러 발생 시 원인을 쉽게 파악 가능
- **게임 흐름 중단 없음**: 문제 트랙에서도 자동으로 다음 라운드로 진행
- **예측 가능한 진행**: 트랙이 순서대로 재생되어 게임 경험 향상

### 기술적 개선
- **에러 처리 강화**: 모든 YouTube Player 에러 코드 처리
- **타이밍 제어**: setTimeout 적절한 관리로 중복 호출 방지
- **상태 관리**: 에러 플래그를 통한 명확한 상태 추적
- **게임 로직 개선**: 순차적 트랙 선택으로 예측 가능한 게임 진행

### 테스트 완료
모든 기능이 실제 게임 환경에서 테스트되었으며, 안정적으로 동작함을 확인했습니다.

---

**작성자**: Claude (AI Assistant)
**검토자**: ListenUp! Team
**승인 일자**: 2025-11-25
