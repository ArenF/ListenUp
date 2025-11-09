# 🚀 게임 테스트 시작 가이드

## 준비사항

### 1. YouTube API 키 설정 (선택적)

실제 YouTube 트랙을 로드하려면:

```bash
# packages/server/.env 파일 생성
YOUTUBE_API_KEY=your_api_key_here
```

> **참고**: API 키 없이도 테스트 가능합니다. 테스트용 트랙 데이터가 이미 설정되어 있습니다.

## 🎮 테스트 시작!

### 터미널 1: 서버 실행

```bash
npm run dev:server
```

**서버가 정상 실행되면 다음과 같이 표시됩니다:**
```
Server running on http://localhost:3000
Socket.IO Ready
```

### 터미널 2: 클라이언트 실행

```bash
npm run dev:client
```

**클라이언트가 실행되면:**
```
  ➜  Local:   http://localhost:5173/
```

## 🎯 게임 테스트 방법

### 방법 1: UI로 테스트 (가장 쉬움)

1. **브라우저에서** `http://localhost:5173` **접속**

2. **방 생성**
   - 닉네임 입력: `플레이어1`
   - "🏠 새 방 만들기" 클릭
   - 방 코드 확인 (예: `ABC123`)

3. **게임 시작** (방장만 보임)
   - "🎮 게임 시작" 버튼 클릭
   - YouTube 플레이어가 자동으로 재생됩니다

4. **정답 제출**
   - 음악을 듣고 입력 창에 답 입력
   - "✅ 제출" 클릭 또는 `Enter` 키

5. **다음 라운드** (방장만)
   - 결과를 확인한 후 "⏭️ 다음 라운드" 클릭
   - 총 3라운드 진행

6. **게임 종료**
   - 마지막 라운드 후 "다음 라운드"를 누르면 자동 종료
   - 또는 "🛑 게임 종료" 버튼으로 중간에 종료 가능

### 방법 2: 멀티플레이어 테스트

1. **브라우저 1** (일반 모드):
   - 방 생성: 닉네임 `플레이어1`
   - 방 코드 확인: `ABC123`

2. **브라우저 2** (시크릿/프라이빗 모드):
   - `http://localhost:5173` 접속
   - 닉네임 `플레이어2`
   - 방 코드 `ABC123` 입력
   - "🚪 방 참가하기" 클릭

3. **브라우저 1**에서:
   - "🎮 게임 시작" 클릭

4. **두 브라우저 모두**:
   - 음악 듣고 정답 입력
   - 누가 더 빨리 맞추는지 경쟁!

5. **점수 확인**:
   - 플레이어 목록에 실시간으로 점수 표시
   - 빠르게 답할수록 높은 점수

### 방법 3: 브라우저 콘솔로 테스트

F12를 눌러 개발자 콘솔을 엽니다:

```javascript
// 모든 이벤트 로그 보기
window.socket.onAny((event, ...args) => {
  console.log(`📡 ${event}:`, args);
});

// 게임 시작 (UI 버튼 대신)
window.socket.emit("start-game", { roomCode: "ABC123" }, console.log);

// 정답 제출
window.socket.emit("submit-answer",
  { roomCode: "ABC123", answer: "Dynamite" },
  console.log
);

// 다음 라운드
window.socket.emit("next-round", { roomCode: "ABC123" }, console.log);
```

## 📊 예상 결과

### 게임 시작 시

**브라우저 화면:**
- ✅ "🎮 게임 시작! (총 3라운드)"
- YouTube 플레이어 자동 재생
- "Round 1/3 - 음악을 듣고 맞춰보세요!"

**서버 터미널:**
```
🎮 Game started in room ABC123
✅ Retrieved 3 tracks from cache (또는 YouTube)
🎵 Round 1/3 started with track: Dynamite
```

### 정답 제출 시

**브라우저 화면:**
- ✅ "정답입니다! +1499점 (스트릭: 1)"
- 플레이어 목록에 점수 표시

**서버 터미널:**
```
📝 플레이어1 submitted: "Dynamite" - ✅ Correct (1499 points)
📊 점수 업데이트
```

### 라운드 종료 시

**브라우저 화면:**
- "🏁 정답: Dynamite - BTS"

**서버 터미널:**
```
🏁 Round 1 ended in room ABC123
   1/1 players answered correctly
```

### 게임 종료 시

**브라우저 화면:**
- 🏆 우승자 표시
- 최종 순위 표
- 각 플레이어의 점수

**서버 터미널:**
```
🎊 Game ended in room ABC123
👑 Winner: 플레이어1 (4497 points)
```

## 🎵 테스트 플레이리스트 정보

기본 테스트 플레이리스트 (`test-playlist`)에는 3곡이 포함되어 있습니다:

1. **Dynamite** - BTS
2. **Butter** - BTS
3. **DNA** - BTS

각 곡은 30초 미리듣기로 재생됩니다.

## 🐛 문제 해결

### YouTube 플레이어가 재생되지 않을 때

1. **API 키 확인**:
   ```bash
   # packages/server/.env
   YOUTUBE_API_KEY=실제_API_키
   ```

2. **서버 재시작**:
   ```bash
   # Ctrl+C로 서버 종료 후
   npm run dev:server
   ```

3. **서버 로그 확인**:
   - `❌ YouTube API error` 메시지 확인
   - API 키 유효성 체크

### 연결이 안 될 때

1. **포트 확인**:
   - 서버: `http://localhost:3000`
   - 클라이언트: `http://localhost:5173`

2. **브라우저 콘솔 확인**:
   - F12 → Console 탭
   - 연결 에러 메시지 확인

3. **서버 로그 확인**:
   - `✅ Client connected: xyz123` 메시지가 나타나야 함

## 🎯 체크리스트

테스트를 완료하려면 다음을 확인하세요:

- [ ] 방 생성 성공
- [ ] 멀티플레이어 참가 성공
- [ ] 게임 시작 성공
- [ ] YouTube 플레이어 재생
- [ ] 정답 제출 성공 (정답/오답 모두)
- [ ] 점수 실시간 업데이트 확인
- [ ] 다음 라운드 진행
- [ ] 3라운드 모두 완료
- [ ] 게임 종료 및 우승자 표시
- [ ] 최종 순위 표시

## 💡 테스트 팁

1. **빠른 테스트**: 혼자서 3라운드 빠르게 진행
2. **멀티플레이어**: 두 브라우저로 경쟁
3. **오답 테스트**: 일부러 틀린 답 입력해보기
4. **시간 보너스**: 빠르게 답할 때 vs 느리게 답할 때 점수 차이 확인
5. **스트릭 보너스**: 연속으로 맞췄을 때 보너스 점수 확인

## 📝 피드백

테스트 중 발견한 버그나 개선사항이 있다면:
1. 서버 터미널 로그 캡처
2. 브라우저 콘솔 로그 캡처 (F12 → Console)
3. 재현 단계 기록

즐거운 테스트 되세요! 🎉
