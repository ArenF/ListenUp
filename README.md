Svelte + Express + Socket.IO 모노레포
GitHub Codespaces와 로컬 환경에서 모두 실행 가능한 Svelte + Express + Socket.IO 모노레포 프로젝트입니다.

🚀 기능
프론트엔드: Svelte + TypeScript + Vite
백엔드: Express + Socket.IO + TypeScript
실시간 통신: Socket.IO를 통한 실시간 채팅
모노레포: 프론트엔드와 백엔드가 하나의 저장소에서 관리
개발 환경: GitHub Codespaces와 로컬 환경 모두 지원
📁 프로젝트 구조
svelte-express-socketio-app/
├── .devcontainer/
│   └── devcontainer.json          # Codespaces 설정
├── frontend/                      # Svelte 프론트엔드
│   ├── src/
│   │   ├── App.svelte
│   │   ├── main.ts
│   │   └── app.css
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── index.html
├── backend/                       # Express 백엔드
│   ├── src/
│   │   └── server.ts
│   ├── package.json
│   └── tsconfig.json
├── package.json                   # 루트 워크스페이스
└── README.md
🛠️ 설치 및 실행
GitHub Codespaces에서 실행
GitHub에서 "Code" → "Codespaces" → "Create codespace" 클릭
자동으로 의존성이 설치됩니다
터미널에서 실행:
bash
npm run dev
로컬 환경에서 실행
저장소 클론:
bash
git clone <repository-url>
cd svelte-express-socketio-app
의존성 설치:
bash
npm run install:all
개발 서버 실행:
bash
npm run dev
📋 사용 가능한 스크립트
루트 레벨
npm run dev - 프론트엔드와 백엔드 동시 실행
npm run dev:frontend - 프론트엔드만 실행
npm run dev:backend - 백엔드만 실행
npm run build - 프론트엔드 빌드
npm run start - 프로덕션 모드로 백엔드 실행
npm run install:all - 모든 의존성 설치
npm run clean - 모든 node_modules 및 dist 폴더 삭제
개별 패키지
프론트엔드 (frontend/):

npm run dev - 개발 서버 실행 (포트 5173)
npm run build - 프로덕션 빌드
npm run preview - 빌드된 앱 미리보기
백엔드 (backend/):

npm run dev - 개발 서버 실행 (포트 3000)
npm run build - TypeScript 컴파일
npm run start - 컴파일된 서버 실행
🌐 포트 정보
프론트엔드: http://localhost:5173
백엔드: http://localhost:3000
API 엔드포인트: http://localhost:3000/api/*
🔧 개발 환경 설정
VS Code 확장 프로그램 (자동 설치됨)
Svelte for VS Code
TypeScript 지원
Prettier 코드 포맷팅
ESLint
Tailwind CSS IntelliSense
환경 변수
백엔드에서 사용할 환경 변수는 backend/.env 파일에 설정:

env
NODE_ENV=development
PORT=3000
🚀 배포
프로덕션 빌드
bash
npm run build
npm run start
Docker 배포 (선택사항)
dockerfile
# 루트 디렉토리에 Dockerfile 생성
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
COPY frontend/package*.json ./frontend/
COPY backend/package*.json ./backend/

RUN npm run install:all

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "run", "start"]
📡 Socket.IO 이벤트
클라이언트 → 서버
message - 메시지 전송
join_room - 채팅방 입장
room_message - 채팅방 메시지 전송
서버 → 클라이언트
welcome - 연결 환영 메시지
message - 브로드캐스트 메시지
room_joined - 방 입장 확인
user_joined - 다른 사용자 입장 알림
room_message - 채팅방 메시지 수신
🔍 API 엔드포인트
GET /api/health - 서버 상태 확인
GET /api/users - 사용자 목록 조회
🛠️ 트러블슈팅
포트 충돌 시
실행 중인 프로세스 확인:
bash
lsof -i :3000
lsof -i :5173
프로세스 종료:
bash
kill -9 <PID>
Codespaces에서 포트 접근 안 됨
포트가 public으로 설정되어 있는지 확인
브라우저에서 포트 포워딩 상태 확인
devcontainer.json의 forwardPorts 설정 확인
의존성 문제
bash
npm run clean
npm run install:all
📚 참고 자료
Svelte 공식 문서
Express.js 공식 문서
Socket.IO 공식 문서
Vite 공식 문서
GitHub Codespaces 문서
