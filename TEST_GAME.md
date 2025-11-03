# 🎮 게임 테스트 가이드

## 빠른 테스트 방법 (브라우저 콘솔)

### 1단계: 서버와 클라이언트 실행

```bash
# 터미널 1: 서버 실행
npm run dev:server

# 터미널 2: 클라이언트 실행
npm run dev:client
```

서버가 `http://localhost:3000`에서 실행되고, 클라이언트가 `http://localhost:5173`에서 실행됩니다.

### 2단계: 브라우저에서 방 생성

1. 브라우저를 열고 `http://localhost:5173` 접속
2. UI에서:
   - 닉네임 입력: "플레이어1"
   - "🏠 새 방 만들기" 클릭
3. 방 코드를 확인합니다 (예: `ABC123`)

### 3단계: 브라우저 콘솔 열기

- **Windows/Linux**: `F12` 또는 `Ctrl + Shift + I`
- **Mac**: `Cmd + Option + I`

### 4단계: 콘솔에서 게임 테스트 명령어 실행

#### 📝 socket 객체 확인
```javascript
// window에서 socket 접근 (디버깅용으로 추가 필요)
// 일단 아래 명령어로 테스트할 수 있습니다
```

#### 🎮 게임 시작 (방장만 가능)
```javascript
// 콘솔에 socket이 없다면 먼저 이 코드를 실행하세요
const socket = window.socket || document.querySelector('script').__socket;

// 게임 시작
socket.emit("start-game", { roomCode: "ABC123" }, (response) => {
  console.log("게임 시작 응답:", response);
});
```

#### 🎵 게임 시작 이벤트 리스너 등록
```javascript
// 게임 시작 알림
socket.on("game-started", (data) => {
  console.log("🎮 게임 시작!", data);
});

// 라운드 시작 알림
socket.on("round-started", (data) => {
  console.log("🎵 라운드 시작!", data);
  console.log("트랙 ID:", data.track.id);
  console.log("재생 URL:", data.track.embedUrl);
  console.log("라운드 시간:", data.duration, "초");
});

// 점수 업데이트
socket.on("score-updated", (data) => {
  console.log("📊 점수 업데이트:", data);
});

// 라운드 종료
socket.on("round-ended", (data) => {
  console.log("🏁 라운드 종료!", data);
  console.log("정답:", data.result.track.name, "-", data.result.track.artist);
  console.log("정답자:", data.result.correctAnswers.length, "명");
});

// 게임 종료
socket.on("game-end", (data) => {
  console.log("🎊 게임 종료!", data);
  console.log("우승자:", data.result.winner?.nickname);
  console.log("최종 점수:", data.result.finalScores);
});
```

#### ✏️ 정답 제출
```javascript
// 정답 제출 (트랙명을 보고 입력)
socket.emit("submit-answer",
  { roomCode: "ABC123", answer: "Dynamite" },
  (response) => {
    console.log("정답 제출 결과:", response);
    if (response.success) {
      console.log("✅", response.result.message);
      console.log("점수:", response.result.score);
      console.log("스트릭:", response.result.streak);
    }
  }
);

// 오답 테스트
socket.emit("submit-answer",
  { roomCode: "ABC123", answer: "Wrong Answer" },
  (response) => {
    console.log("정답 제출 결과:", response);
  }
);
```

#### ⏭️ 다음 라운드 시작 (방장만)
```javascript
socket.emit("next-round", { roomCode: "ABC123" }, (response) => {
  console.log("다음 라운드:", response);
});
```

#### 🛑 게임 강제 종료 (방장만)
```javascript
socket.emit("game-end", { roomCode: "ABC123" }, (response) => {
  console.log("게임 종료:", response);
});
```

---

## 🎯 전체 테스트 시나리오

### 시나리오 1: 혼자 테스트 (싱글 플레이어)

```javascript
// 1. 이벤트 리스너 등록 (위의 코드 모두 복사해서 실행)

// 2. 게임 시작
socket.emit("start-game", { roomCode: "ABC123" }, console.log);

// 3. 정답 제출 (정답이 뭔지는 round-started 로그에서 확인)
socket.emit("submit-answer", { roomCode: "ABC123", answer: "Dynamite" }, console.log);

// 4. 다음 라운드
socket.emit("next-round", { roomCode: "ABC123" }, console.log);

// 5. 또 정답 제출
socket.emit("submit-answer", { roomCode: "ABC123", answer: "Butter" }, console.log);

// 6. 다음 라운드
socket.emit("next-round", { roomCode: "ABC123" }, console.log);

// 7. 마지막 라운드 정답
socket.emit("submit-answer", { roomCode: "ABC123", answer: "DNA" }, console.log);

// 8. 게임 종료 (마지막 라운드 후 자동으로 next-round 하면 게임 종료)
socket.emit("next-round", { roomCode: "ABC123" }, console.log);
```

### 시나리오 2: 멀티플레이어 테스트

1. **브라우저 1** (방장):
   - 방 생성: "플레이어1"
   - 방 코드 확인: `ABC123`

2. **브라우저 2** (시크릿 모드):
   - 같은 URL 접속: `http://localhost:5173`
   - 방 참가: 닉네임 "플레이어2", 방 코드 `ABC123`

3. **브라우저 1 콘솔** (방장):
```javascript
// 게임 시작
socket.emit("start-game", { roomCode: "ABC123" }, console.log);
```

4. **두 브라우저 모두**:
```javascript
// 정답 제출
socket.emit("submit-answer", { roomCode: "ABC123", answer: "Dynamite" }, console.log);
```

5. **브라우저 1 콘솔** (방장):
```javascript
// 다음 라운드
socket.emit("next-round", { roomCode: "ABC123" }, console.log);
```

---

## 🔍 디버깅 팁

### 현재 방 코드 확인
```javascript
// UI에서 확인하거나
document.querySelector('.room-code').textContent
```

### Socket 연결 상태 확인
```javascript
socket.connected  // true/false
socket.id         // 소켓 ID
```

### 서버 로그 확인
터미널 1 (서버)에서 다음과 같은 로그를 확인할 수 있습니다:
```
🎮 Game started in room ABC123
🎵 Round 1/3 started with track: Dynamite
📝 플레이어1 submitted: "Dynamite" - ✅ Correct (1499 points)
🏁 Round 1 ended in room ABC123
   1/1 players answered correctly
```

---

## 📌 주의사항

1. **YouTube API 키**: 서버가 실제 YouTube에서 트랙을 로드하려면 `.env` 파일에 `YOUTUBE_API_KEY`가 설정되어 있어야 합니다.

2. **방장 권한**:
   - `start-game`: 방장만 가능
   - `next-round`: 방장만 가능
   - `game-end`: 방장만 가능
   - `submit-answer`: 모든 플레이어 가능

3. **자동 라운드 종료**: 모든 플레이어가 정답을 제출하면 2초 후 자동으로 라운드가 종료됩니다.

4. **트랙 정보**: `round-started` 이벤트에서는 정답(트랙명, 아티스트)이 숨겨져 있습니다. 테스트를 위해 서버 터미널 로그를 확인하세요.

---

## 🎉 성공 예시

게임이 정상적으로 작동하면 다음과 같은 로그를 볼 수 있습니다:

**브라우저 콘솔:**
```
🎮 게임 시작! {totalRounds: 3, players: Array(1)}
🎵 라운드 시작! {roundNumber: 1, track: {...}, duration: 30}
정답 제출 결과: {success: true, result: {isCorrect: true, score: 1499, ...}}
✅ 정답입니다! +1499점
📊 점수 업데이트: {scores: [[...]], streaks: [[...]]}
🏁 라운드 종료! {result: {...}}
정답: Dynamite - BTS
```

**서버 터미널:**
```
✅ Client connected: xyz123
Room ABC123 created by 플레이어1
🎮 Game started in room ABC123
🎵 Round 1/3 started with track: Dynamite
📝 플레이어1 submitted: "Dynamite" - ✅ Correct (1499 points)
✅ All players submitted answers in room ABC123. Auto-ending round in 2 seconds...
🏁 Round 1 ended in room ABC123
   1/1 players answered correctly
```
