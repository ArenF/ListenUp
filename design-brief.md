# ListenUp! 디자인 리뉴얼 상의

## 현재 상태
- renew-design 브랜치: packages/client (Svelte + TS + Vite)
- app.css 75줄, 크림/살구 웜톤 라이트 테마 (#fff7ee, #ffe9d5)
- 경쟁사 조사 완료: SongGuess(Spotify그린 다크), MusicQuizly(다크 보라), SongIQ(라이트 옐로), Blindtest.gg(다크), Mukiz(파스텔)
- 파티게임 디자인 벤치마크: Gartic Phone(퍼플네온 #201255+#A890E8), GameBuddies(극흑+시안 #00d9ff+레드)

## 게임 특성
- 원곡 음악 스피드퀴즈 (YouTube API 재생 + Spotify 플레이리스트)
- 방코드 기반 멀티플레이, 로비(방 목록/생성/참가)는 renew-design에 이미 구현됨
- 실시간 Socket.IO 게임, 채팅, 점수

## 제안 디자인 방향 (3안)
A안 - Spotify DNA + 게임 파워: #121212 배경/#181818 카드, 필 버튼+원형 플레이버튼, 액센트는 커스텀(옐로오렌지 #ffcc33 등)
B안 - Gartic Phone식 파티 네온: 딥퍼플 배경 #201255 + 라벤더 #A890E8, 큰 타이포, HOW TO PLAY 4스텝 카드
C안 - GameBuddies식 네온 아케이드: 극흑 #05020e + 시안 #00d9ff + 레드 #e94560

## 요청
1. 각 안의 장단점을 ListenUp 관점(음악 게임, 친구 초대 흐름, 모바일 우선)으로 평가
2. 추천안 선정 이유
3. 핵심 화면(랜딩/로비/게임플레이/결과)의 디자인 토큰 제안: 색·타이포·버튼·카드
4. 애니메이션/모션 우선순위 (게임 몰입감 기준)
한국어로 답변.
