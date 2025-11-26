# ListenUp! Logger 시스템 구현 및 버그 수정 보고서

**날짜**: 2025년 11월 26일
**작성자**: Claude (AI Assistant)
**프로젝트**: ListenUp! - 실시간 멀티플레이어 음악 맞추기 게임

---

## 📋 목차

1. [개요](#개요)
2. [작업 환경](#작업-환경)
3. [1단계: 프로젝트 구조 리팩토링](#1단계-프로젝트-구조-리팩토링)
4. [2단계: Logger 시스템 구현](#2단계-logger-시스템-구현)
5. [3단계: 버그 수정](#3단계-버그-수정)
6. [테스트 결과](#테스트-결과)
7. [파일 변경 사항](#파일-변경-사항)
8. [향후 개선 사항](#향후-개선-사항)
9. [결론](#결론)

---

## 개요

ListenUp! 프로젝트의 클라이언트 코드베이스를 리팩토링하고, Logger 시스템을 구현하여 에러 관리를 체계화했습니다. 또한 게임 진행 중 발견된 2가지 치명적인 버그를 수정했습니다.

### 작업 목표

1. **폴더 구조 개선**: 컴포넌트, 유틸리티, 상태 관리를 명확히 분리
2. **Logger 시스템 구현**: alert() 대신 일관된 Toast UI로 사용자 알림
3. **버그 수정**: 중복 플레이어 참가 및 YouTube Player DOM 파괴 문제 해결

---

## 작업 환경

```
플랫폼: Linux (Codespaces)
Node.js: 20.x
TypeScript: 5.9.3
빌드 도구: Vite 7.2.2
프레임워크: Svelte 5
작업 디렉토리: /workspaces/ListenUp/packages/client
```

---

## 1단계: 프로젝트 구조 리팩토링

### 기존 구조

```
lib/
├── pages/
│   ├── game/
│   │   ├── Game.svelte (793줄)
│   │   ├── gameStore.ts
│   │   └── ...
│   └── playlist/
└── stores/ (비어있음)
```

### 개선된 구조

```
lib/
├── components/
│   ├── common/              # 공통 UI 컴포넌트
│   │   └── Toast.svelte
│   └── game/                # 게임 전용 컴포넌트
│       └── (추후 추가 예정)
├── pages/
│   ├── game/
│   └── playlist/
├── stores/                  # 상태 관리
│   ├── gameStore.ts        # ✅ 이동 완료
│   └── toastStore.ts       # 🆕 새로 추가
├── utils/                   # 유틸리티 함수
│   ├── logger.ts           # 🆕 Logger 핵심 로직
│   └── messages.ts         # 🆕 메시지 정의
├── types/                   # 타입 정의 (추후 사용)
└── socket.ts
```

### 주요 변경사항

1. **gameStore.ts 이동**: `pages/game/` → `stores/`
2. **새 폴더 생성**: `components/`, `utils/`, `types/`
3. **import 경로 수정**: Game.svelte에서 gameStore import 경로 업데이트

---

## 2단계: Logger 시스템 구현

### 2.1 설계 목표

기존의 `alert()` 방식은 다음과 같은 문제가 있었습니다:
- ❌ 못생긴 브라우저 기본 팝업
- ❌ 페이지 전체를 막음 (모달 차단)
- ❌ 커스터마이징 불가
- ❌ 자동으로 사라지지 않음
- ❌ 에러 메시지가 코드 전체에 흩어져 있음

**Logger 시스템의 장점**:
- ✅ 예쁜 Toast UI (우측 상단 표시)
- ✅ 페이지를 막지 않음
- ✅ 3초 후 자동 사라짐
- ✅ 타입별 색상 구분 (error=빨강, success=초록, warn=주황, info=파랑)
- ✅ 중앙 집중식 메시지 관리
- ✅ 다국어 지원 준비
- ✅ 로그 추적 및 분석 용이

### 2.2 구현 상세

#### A. messages.ts (71줄)

모든 에러 및 정보 메시지를 카테고리별로 관리합니다.

```typescript
export const MESSAGES = {
  SOCKET: {
    CONNECTION_FAILED: '서버 연결에 실패했습니다. 다시 시도해주세요.',
    DISCONNECTED: '서버와의 연결이 끊어졌습니다.',
    // ... 9개 메시지
  },
  YOUTUBE: {
    PLAYBACK_ERROR: '영상을 재생할 수 없습니다.',
    EMBED_BLOCKED: '이 영상은 재생할 수 없습니다. 다음 곡으로 넘어갑니다.',
    // ... 8개 메시지
  },
  PLAYLIST: {
    LOAD_FAILED: '플레이리스트를 불러올 수 없습니다.',
    SAVE_FAILED: '플레이리스트 저장에 실패했습니다.',
    // ... 11개 메시지
  },
  GAME: {
    START_FAILED: '게임 시작에 실패했습니다.',
    NOT_HOST: '방장만 게임을 시작할 수 있습니다.',
    // ... 6개 메시지
  },
  SUCCESS: {
    PLAYLIST_SAVED: '플레이리스트가 저장되었습니다.',
    TRACK_ADDED: '트랙이 추가되었습니다.',
    // ... 7개 메시지
  },
  INFO: {
    PLAYER_JOINED: '님이 입장했습니다.',
    ROUND_START: '라운드 시작!',
    // ... 6개 메시지
  },
} as const;
```

**특징**:
- TypeScript `as const`로 타입 안전성 보장
- 6개 카테고리, 총 46개 메시지 정의
- `MessageCategory`, `MessageKey` 타입 헬퍼 제공

#### B. toastStore.ts (79줄)

Toast UI 상태를 관리하는 Svelte Store입니다.

```typescript
interface Toast {
  id: number;
  type: 'info' | 'warn' | 'error' | 'success';
  message: string;
  duration: number;
}

function createToastStore() {
  const { subscribe, update } = writable<Toast[]>([]);
  let nextId = 0;

  return {
    subscribe,
    show(type: ToastType, message: string, duration = 3000) {
      const id = nextId++;
      const toast: Toast = { id, type, message, duration };

      update(toasts => [...toasts, toast]);

      setTimeout(() => {
        this.remove(id);
      }, duration);

      return id;
    },
    remove(id: number) { ... },
    clear() { ... },
    // 빠른 접근 헬퍼
    info(message: string, duration?: number) { ... },
    warn(message: string, duration?: number) { ... },
    error(message: string, duration?: number) { ... },
    success(message: string, duration?: number) { ... },
  };
}
```

**특징**:
- 여러 Toast 동시 표시 가능
- 자동 제거 타이머 내장
- 고유 ID로 개별 관리

#### C. logger.ts (164줄)

Logger의 핵심 로직을 담당합니다.

```typescript
class Logger {
  private isDevelopment = import.meta.env.DEV;

  error<T extends MessageCategory>(
    category: T,
    key: MessageKey<T>,
    options: LogOptions = {}
  ) {
    const message = MESSAGES[category][key] as string;
    this.log('error', message, options);
  }

  // warn, info, success, custom 메서드...

  private log(level: LogLevel, message: string, options: LogOptions) {
    const { showToast = true, consoleLog = true, duration = 3000, details } = options;

    // Toast 표시
    if (showToast) {
      toastStore.show(level as ToastType, message, duration);
    }

    // 콘솔 로그 (개발 환경)
    if (consoleLog && this.isDevelopment) {
      const timestamp = new Date().toISOString();
      const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

      switch (level) {
        case 'error':
          console.error(prefix, message, details || '');
          break;
        // ...
      }
    }

    // 추후 확장: 서버로 에러 전송 (운영 환경)
    // if (!this.isDevelopment && level === 'error') {
    //   this.sendToServer(message, details);
    // }
  }
}

export const logger = new Logger();
```

**특징**:
- 타입 안전한 메시지 키 사용
- Toast UI와 콘솔 로그 통합
- 개발/운영 환경 분리
- 확장 가능한 구조 (서버 전송 준비)

#### D. Toast.svelte (136줄)

Toast UI 컴포넌트입니다.

```svelte
<script lang="ts">
  import { toastStore } from '../../stores/toastStore';
  import { fly } from 'svelte/transition';

  const toasts = $derived($toastStore);
</script>

<div class="toast-container">
  {#each toasts as toast (toast.id)}
    <div
      class="toast toast-{toast.type}"
      transition:fly={{ x: 300, duration: 300 }}
      role="alert"
      aria-live="polite"
    >
      <!-- 아이콘 (타입별) -->
      <div class="toast-icon">
        {#if toast.type === 'success'}
          <svg><!-- 체크 아이콘 --></svg>
        {:else if toast.type === 'error'}
          <svg><!-- X 아이콘 --></svg>
        <!-- ... -->
        {/if}
      </div>

      <!-- 메시지 -->
      <div class="toast-message">{toast.message}</div>

      <!-- 닫기 버튼 -->
      <button class="toast-close" onclick={() => toastStore.remove(toast.id)}>
        <svg><!-- X 아이콘 --></svg>
      </button>
    </div>
  {/each}
</div>

<style>
  .toast-container {
    position: fixed;
    top: 1rem;
    right: 1rem;
    z-index: 9999;
  }

  .toast {
    display: flex;
    gap: 0.75rem;
    padding: 1rem;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    background-color: white;
    border-left: 4px solid;
  }

  .toast-success { border-left-color: #4caf50; }
  .toast-error { border-left-color: #f44336; }
  .toast-warn { border-left-color: #ff9800; }
  .toast-info { border-left-color: #2196f3; }
  /* ... */
</style>
```

**특징**:
- Svelte 5의 `$derived` 사용
- `fly` 트랜지션으로 부드러운 애니메이션
- 타입별 아이콘 및 색상
- 접근성 (ARIA) 지원
- 반응형 디자인

### 2.3 사용 예시

#### Before (기존)

```typescript
try {
  const res = await fetch('/api/playlists');
  // ...
} catch (err: any) {
  alert(err.message); // ❌ 못생김, 페이지 막음
}
```

#### After (Logger 사용)

```typescript
import { logger } from '$lib/utils/logger';

try {
  const res = await fetch('/api/playlists');
  // ...
} catch (err: any) {
  logger.error('PLAYLIST', 'LOAD_FAILED', { details: err }); // ✅ 예쁜 Toast!
}

// 성공 메시지
logger.success('PLAYLIST', 'SAVED');

// 커스텀 메시지
logger.custom('info', `${nickname}님이 입장했습니다.`);
```

### 2.4 적용 결과

**Playlist.svelte에서 10개의 alert() 교체**:

| 라인 | Before | After | 타입 |
|------|--------|-------|------|
| 117 | `alert("플레이리스트 이름을 입력해주세요")` | `logger.warn('PLAYLIST', 'NAME_REQUIRED')` | warn |
| 172 | `alert(err.message)` (저장 실패) | `logger.error('PLAYLIST', 'SAVE_FAILED', { details: err })` | error |
| 202 | `alert(err.message)` (삭제 실패) | `logger.error('PLAYLIST', 'DELETE_FAILED', { details: err })` | error |
| 233 | `alert("유효한 YouTube URL...")` | `logger.warn('PLAYLIST', 'INVALID_URL')` | warn |
| 244 | `alert("YouTube 비디오 ID...")` | `logger.warn('PLAYLIST', 'VIDEO_ID_REQUIRED')` | warn |
| 258 | `alert(err.message)` (트랙 조회 실패) | `logger.error('PLAYLIST', 'TRACK_FETCH_FAILED', { details: err })` | error |
| 345 | `alert(err.message)` (트랙 추가 실패) | `logger.error('PLAYLIST', 'TRACK_ADD_FAILED', { details: err })` | error |
| 379 | `alert(err.message)` (트랙 제거 실패) | `logger.error('PLAYLIST', 'TRACK_REMOVE_FAILED', { details: err })` | error |
| 433 | `alert("정답이 업데이트...")` | `logger.success('SUCCESS', 'PLAYLIST_SAVED')` | success |
| 436 | `alert(err.message)` (업데이트 실패) | `logger.error('PLAYLIST', 'SAVE_FAILED', { details: err })` | error |

---

## 3단계: 버그 수정

게임 테스트 중 2가지 치명적인 버그를 발견하고 수정했습니다.

### 버그 1: 중복 플레이어 참가

#### 문제 상황

```
✅ Loaded playlists: Array(4)
Game.svelte:53 서버 연결: nvJDAHWx3TVjWsZ-AAAB
Game.svelte:75 새 플레이어 참가: Object
Game.svelte:75 새 플레이어 참가: Object  ← 중복!
```

**증상**: 플레이어 한 명이 참가하면 2번 나타남

#### 원인 분석

**서버 코드** (`room.handler.ts:157-160`):
```typescript
// 방의 다른 플레이어들에게 알림
socket.to(code).emit(events.PLAYER_JOINED, {
  player: joiningPlayer,
  playerCount: result.room.players.size,
});
```

**클라이언트 코드** (Game.svelte:74-82):
```typescript
socket.on("player-joined", (data) => {
  console.log("새 플레이어 참가:", data);
  if (currentRoom) {
    updateGameStore({ players: [...players, data.player] }); // ❌ 중복 체크 없음!
  }
});
```

**문제**:
- 이미 있는 플레이어를 또 추가할 수 있음
- `callback({ success: true, room: roomData })`에서 이미 전체 room 데이터를 받았는데, 여기서 또 플레이어를 추가하면 중복됨

#### 수정 내용

**Game.svelte:80-85**:
```typescript
socket.on("player-joined", (data) => {
  console.log("새 플레이어 참가:", data);
  updateGameStore({
    statusMessage: `🎮 ${data.player.nickname}님이 입장했습니다!`,
  });
  if (currentRoom) {
    // ✅ 중복 체크: 이미 있는 플레이어는 추가하지 않음
    const existingPlayer = players.find((p) => p.id === data.player.id);
    if (!existingPlayer) {
      updateGameStore({ players: [...players, data.player] });
    }
  }
});
```

**효과**: 플레이어 목록에 중복 표시 방지

---

### 버그 2: YouTube Player DOM 파괴 문제

#### 문제 상황

```
Game.svelte:311 🎬 YouTube Player 생성 중... UFQEttrn6CQ
Game.svelte:333 ✅ YouTube Player 준비 완료!
Game.svelte:140 🎵 라운드 시작!
Game.svelte:234 🏁 라운드 종료!
Game.svelte:302 🗑️ 기존 플레이어 파괴
Game.svelte:311 🎬 YouTube Player 생성 중... p3aVaChXrMI
www-widgetapi.js:194 Uncaught TypeError: Cannot read properties of null (reading 'src')
```

**증상**:
- 1라운드는 정상 재생
- 2라운드부터 영상이 나오지 않음
- 콘솔에 `Cannot read properties of null (reading 'src')` 에러

#### 원인 분석

**기존 코드** (Game.svelte:305-322):
```typescript
// 기존 플레이어 파괴
if (player && typeof player.destroy === "function") {
  console.log("🗑️ 기존 플레이어 파괴");
  try {
    player.destroy(); // ❌ DOM 요소 완전 제거!
  } catch (e) {
    console.warn("플레이어 파괴 중 에러 (무시):", e);
  }
}

// 새 플레이어 생성
const newPlayer = new YT.Player("youtube-player", { // ❌ DOM이 없어서 실패!
  height: "300",
  width: "100%",
  videoId: preparedTrack.id,
  // ...
});
```

**GamePlayer.svelte** (17줄):
```svelte
{#if preparedTrack || currentTrack}
  <div class="youtube-player-hidden">
    <div id="youtube-player"></div> <!-- 이 요소가 destroy()로 제거됨 -->
  </div>
{/if}
```

**문제**:
1. `player.destroy()`가 `<div id="youtube-player">`를 DOM에서 완전히 제거
2. 다음 라운드에서 `new YT.Player("youtube-player", ...)`를 호출하지만 DOM 요소가 없음
3. YouTube API가 null 참조 에러 발생

#### 수정 내용

**Game.svelte:314-328**:
```typescript
// 기존 플레이어 파괴
if (player && typeof player.destroy === "function") {
  console.log("🗑️ 기존 플레이어 파괴");
  try {
    player.destroy();
  } catch (e) {
    console.warn("플레이어 파괴 중 에러 (무시):", e);
  }
}

// ✅ DOM 요소 확인 및 재생성
let playerElement = document.getElementById("youtube-player");
if (!playerElement) {
  console.log("🔨 YouTube Player DOM 요소 재생성");
  const container = document.querySelector(".youtube-player-hidden");
  if (container) {
    const newDiv = document.createElement("div");
    newDiv.id = "youtube-player";
    container.appendChild(newDiv);
    playerElement = newDiv;
  } else {
    console.error("❌ YouTube Player 컨테이너를 찾을 수 없습니다");
    return;
  }
}

// ✅ 이제 안전하게 생성 가능
const newPlayer = new YT.Player("youtube-player", {
  // ...
});
```

**효과**:
- 모든 라운드에서 YouTube Player 정상 작동
- `Cannot read properties of null` 에러 제거
- 게임 플로우 안정화

---

## 테스트 결과

### 빌드 결과

```bash
$ npm run build

✓ 158 modules transformed.
✓ built in 2.28s

dist/index.html                   0.45 kB │ gzip:  0.29 kB
dist/assets/index-CYZCnII_.css   19.66 kB │ gzip:  3.80 kB
dist/assets/index-B0WZgEKR.js   118.47 kB │ gzip: 40.03 kB
```

**결과**: ✅ 빌드 성공

### 기능 테스트

| 기능 | 테스트 항목 | 결과 |
|------|------------|------|
| **Logger 시스템** | Toast UI 표시 | ✅ 통과 |
| | 타입별 색상 구분 | ✅ 통과 |
| | 자동 사라짐 (3초) | ✅ 통과 |
| | 여러 Toast 동시 표시 | ✅ 통과 |
| | 콘솔 로그 출력 | ✅ 통과 |
| **플레이어 참가** | 중복 체크 | ✅ 통과 |
| | 플레이어 목록 정확성 | ✅ 통과 |
| **YouTube Player** | 1라운드 재생 | ✅ 통과 |
| | 2라운드 이상 재생 | ✅ 통과 |
| | DOM 요소 재생성 | ✅ 통과 |
| | 에러 없이 여러 라운드 진행 | ✅ 통과 |

### 코드 품질

- ✅ TypeScript 타입 체크 통과
- ✅ 모든 import 경로 정상
- ⚠️ 접근성 경고 12개 (기존 이슈, 우선순위 낮음)

---

## 파일 변경 사항

### 생성된 파일 (5개)

| 파일 | 위치 | 라인 수 | 설명 |
|------|------|---------|------|
| messages.ts | lib/utils/ | 71 | 에러 메시지 정의 |
| logger.ts | lib/utils/ | 164 | Logger 핵심 로직 |
| toastStore.ts | lib/stores/ | 79 | Toast 상태 관리 |
| Toast.svelte | lib/components/common/ | 136 | Toast UI 컴포넌트 |
| *(폴더 4개)* | components/, utils/, types/ | - | 새 폴더 구조 |

### 수정된 파일 (3개)

| 파일 | 수정 내용 | 라인 수 변화 |
|------|-----------|-------------|
| App.svelte | Toast 컴포넌트 추가 | +3 |
| Game.svelte | 중복 플레이어 체크, DOM 재생성 로직 | +20 |
| Playlist.svelte | 10개 alert() → logger 교체 | 변화 없음 |

### 이동된 파일 (1개)

| 파일 | 이전 위치 | 새 위치 |
|------|----------|---------|
| gameStore.ts | lib/pages/game/ | lib/stores/ |

**총 변경사항**: 9개 파일 (생성 5개, 수정 3개, 이동 1개)

---

## 향후 개선 사항

### 1. 공통 컴포넌트 추가 추출

현재 코드에는 아직 중복이 남아있습니다:

**Button 컴포넌트** (반복되는 버튼 스타일):
```svelte
<!-- components/common/Button.svelte -->
<script lang="ts">
  interface Props {
    variant?: 'primary' | 'secondary' | 'danger';
    disabled?: boolean;
    onclick?: () => void;
  }
</script>
```

**Modal 컴포넌트** (PlaylistForm, TrackForm에서 반복):
```svelte
<!-- components/common/Modal.svelte -->
<script lang="ts">
  interface Props {
    show: boolean;
    title: string;
    onClose: () => void;
  }
</script>
```

**Input 컴포넌트** (일관된 입력 필드):
```svelte
<!-- components/common/Input.svelte -->
<script lang="ts">
  interface Props {
    type?: 'text' | 'number';
    value: string;
    placeholder?: string;
    oninput: (e: Event) => void;
  }
</script>
```

### 2. 타입 정의 분리

현재 Playlist.svelte 내부에 정의된 타입들을 분리:

**lib/types/playlist.ts**:
```typescript
export interface PlaylistTrack {
  videoId: string;
  answers: string[];
  hints?: Hint[];
  startSeconds?: number;
  endSeconds?: number;
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  tracks: PlaylistTrack[];
  roundCount: number;
}

export interface Track {
  id: string;
  name: string;
  artist: string;
  duration: number;
  startSeconds: number;
  endSeconds: number;
}
```

**lib/types/game.ts**:
```typescript
export interface Room {
  code: string;
  players: Player[];
  settings: RoomSettings;
}

export interface Player {
  id: string;
  nickname: string;
  score: number;
  isHost: boolean;
}
```

### 3. Game.svelte 분할

현재 793줄의 Game.svelte를 더 작은 단위로 분할:

**GameSocketManager.svelte** (새로 생성):
- Socket.IO 이벤트 리스너 관리 (11개 이벤트)
- 200줄 예상

**GameYouTubeManager.svelte** (새로 생성):
- YouTube Player API 관리 및 에러 처리
- 150줄 예상

**Game.svelte** (단순화):
- Socket 연결
- YouTube Player 초기화
- 페이지 라우팅만 담당
- 200줄 목표

### 4. 접근성 개선

현재 12개의 접근성 경고 해결:

1. **클릭 이벤트가 있는 `<div>`**:
   - `role="button"` 추가
   - `onkeydown` 핸들러 추가 (Enter, Space)

2. **`<label>`과 입력 필드 연결**:
   ```svelte
   <label for="playlist-name">플레이리스트 이름</label>
   <input id="playlist-name" type="text" />
   ```

3. **ARIA 라벨 추가**:
   ```svelte
   <button aria-label="닫기" onclick={onClose}>
     <svg>...</svg>
   </button>
   ```

### 5. Logger 확장

서버 로그 전송 기능 구현:

```typescript
// logger.ts
private async sendToServer(message: string, details?: any) {
  try {
    await fetch('/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        level: 'error',
        message,
        details,
        timestamp: new Date(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      })
    });
  } catch (error) {
    console.error('Failed to send log to server:', error);
  }
}
```

**활용**:
- 운영 환경에서 에러 자동 수집
- Sentry, LogRocket 등과 연동
- 사용자 행동 분석

---

## 결론

### 주요 성과

1. **구조화된 폴더 시스템**: 컴포넌트, 유틸리티, 상태 관리가 명확히 분리됨
2. **체계적인 에러 관리**: Logger 시스템으로 일관된 UX 제공
3. **안정적인 게임 플로우**: 2가지 치명적 버그 수정으로 게임 안정화
4. **확장 가능한 구조**: 다국어, 로그 추적, 공통 컴포넌트 추가 준비 완료

### 코드 품질 향상

- **유지보수성**: ⭐⭐⭐⭐☆ (중복 코드 감소, 명확한 구조)
- **확장성**: ⭐⭐⭐⭐⭐ (Logger, Toast, 폴더 구조 모두 확장 가능)
- **사용자 경험**: ⭐⭐⭐⭐⭐ (Toast UI, 버그 수정으로 안정성 향상)
- **개발자 경험**: ⭐⭐⭐⭐☆ (타입 안전성, 명확한 에러 메시지)

### 다음 단계

리팩토링 작업이 완료되었으므로, 이제 TODO.md의 기능 추가 작업을 진행할 준비가 되었습니다:

1. **UI/UX 실시간 반응 시스템**
   - 정답 시 네임바 초록색 피드백
   - 오답 시 네임바 붉은색 표시 및 shake 효과
   - 답안 제출 시 bounce 애니메이션
   - 점수 증가 카운팅 애니메이션

2. **힌트 시스템 구현**
   - PlaylistTrack 타입 확장 (hints 필드)
   - GameService에 힌트 타이머 로직
   - 클라이언트 힌트 UI 컴포넌트

3. **비디오 재생 구간 커스터마이징**
   - startSeconds, endSeconds 필드 추가
   - 플레이리스트 관리 페이지 재생 구간 설정 UI

4. **정답 후 뮤직비디오 재생**
   - 준비 패널에 YouTube Player 추가
   - 정답 영상 자동 재생 로직

---

**작성 완료**: 2025년 11월 26일
**총 작업 시간**: 약 2시간
**파일 변경**: 9개 (생성 5개, 수정 3개, 이동 1개)
**코드 추가**: +450줄, 코드 수정: +30줄
