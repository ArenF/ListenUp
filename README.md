# 🎵 ListenUp!

Spotify API를 활용한 실시간 멀티플레이어 음악 맞추기 게임

---

## 📋 프로젝트 소개

ListenUp!은 친구들과 함께 음악을 맞추며 경쟁하는 웹 기반 게임입니다.

- 🎮 로그인 없이 방코드만으로 즉시 플레이
- 🏆 실시간 순위와 점수 시스템
- 💬 게임 중 채팅으로 소통
- 📱 모바일/데스크톱 크로스플랫폼 지원

---

## 🏗️ 기술 스택

### Frontend

- **Svelte** + TypeScript
- **Socket.IO Client** (실시간 통신)
- **Vite** (빌드 도구)

### Backend

- **Node.js** + Express
- **Socket.IO** (실시간 통신)
- **Spotify Web API**

### 개발 환경

- **GitHub Codespaces** (devcontainer)
- **npm workspaces** (모노레포 관리)

---

## 🚀 빠른 시작

### 1. GitHub Codespaces에서 시작하기

이 리포지토리는 devcontainer로 구성되어 있습니다.

1. GitHub에서 이 리포지토리를 엽니다
2. **Code** 버튼 → **Codespaces** → **Create codespace on main** 클릭
3. 자동으로 개발 환경이 구성됩니다 (약 2-3분 소요)

devcontainer가 자동으로 다음을 설정합니다:

- Node.js 20 설치
- 필요한 VS Code 확장 설치 (Svelte, ESLint, Prettier)
- `npm install` 실행
- 포트 3000(서버), 5173(클라이언트) 포워딩

### 2. Spotify API 설정

게임에 음악을 제공하기 위해 Spotify API 키가 필요합니다.

#### Spotify App 등록

1. [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) 접속
2. **Create App** 클릭
3. 정보 입력:
   - App name: `ListenUp!`
   - App description: `음악 맞추기 게임`
   - Redirect URIs: (비워둠)
   - APIs used: `Web API`
4. **Client ID**와 **Client Secret** 복사

#### 환경변수 설정

```bash
# .env.example을 .env로 복사
cp .env.example .env

# .env 파일을 열어 Spotify 키 입력
nano .env
```

`.env` 파일 내용:

```bash
SPOTIFY_CLIENT_ID=여기에_client_id_붙여넣기
SPOTIFY_CLIENT_SECRET=여기에_client_secret_붙여넣기

PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

### 3. 개발 서버 실행

#### 방법 A: 동시 실행 (권장)

```bash
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

---

## 📁 프로젝트 구조

```
listenup/
├── .devcontainer/
│   └── devcontainer.json       # Codespace 환경 설정
├── packages/
│   ├── client/                 # Svelte 프론트엔드
│   │   ├── src/
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── server/                 # Express 백엔드
│       ├── src/
│       ├── package.json
│       └── tsconfig.json
├── .env.example                # 환경변수 템플릿
├── .gitignore                  # Git 제외 파일
├── package.json                # 루트 workspace 설정
├── tsconfig.base.json          # 공통 TypeScript 설정
└── README.md                   # 이 파일
```

---

## 🛠️ 주요 명령어

### 개발

```bash
npm run dev           # 서버 + 클라이언트 동시 실행
npm run dev:server    # 서버만 실행 (포트 3000)
npm run dev:client    # 클라이언트만 실행 (포트 5173)
```

### 빌드

```bash
npm run build         # 전체 빌드
npm run build:server  # 서버만 빌드
npm run build:client  # 클라이언트만 빌드
```

### 정리

```bash
npm run clean         # node_modules 및 빌드 파일 삭제
```

---

## 📦 설정 파일 설명

### devcontainer.json

GitHub Codespaces 환경을 정의합니다.

- **이미지**: Node.js 20 기반
- **확장**: Svelte, ESLint, Prettier 자동 설치
- **포트**: 3000, 5173 자동 포워딩
- **초기화**: `npm install` 자동 실행

### package.json (루트)

npm workspaces를 설정하여 모노레포를 관리합니다.

- `packages/*` 아래의 모든 패키지를 workspace로 등록
- 루트에서 모든 패키지를 한 번에 관리 가능

### tsconfig.base.json

TypeScript 공통 설정을 정의합니다.

- ES2020 타겟
- 엄격 모드 활성화
- 각 패키지는 이 설정을 확장하여 사용

### .env.example

필요한 환경변수의 템플릿입니다.

- Spotify API 키
- 서버 포트 및 환경 설정
- CORS 설정

⚠️ **주의**: `.env` 파일은 절대 Git에 커밋하지 마세요!

---

## 🔧 개발 환경 특징

### npm workspaces

- 의존성을 루트에서 통합 관리
- 패키지 간 심볼릭 링크 자동 생성
- `npm install` 한 번으로 모든 패키지 설치

### TypeScript 구조

```
tsconfig.base.json (공통 설정)
    ├── packages/client/tsconfig.json (Svelte 전용)
    └── packages/server/tsconfig.json (Node.js 전용)
```

### 포트 구성

- **3000**: Express 백엔드 서버
- **5173**: Vite 개발 서버 (클라이언트)

---

## 📝 다음 단계

개발 환경 구성이 완료되었습니다! 이제 다음 단계로 진행할 수 있습니다:

1. **packages/client** 폴더에 Svelte 앱 설정
2. **packages/server** 폴더에 Express 서버 설정
3. Youtube Data V3 API 연동 및 테스트
4. Socket.IO 기본 통신 구현

자세한 개발 로드맵은 `ListenUp! 기획서.md`를 참조하세요.

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
feat: YouTube API 연동 추가
fix: 방장 나갈 시 크래시 수정
```

---

## 📄 라이선스

MIT License

---

**문서 버전**: 1.0  
**최종 수정일**: 2025-10-15  
**작성자**: ListenUp! Team
