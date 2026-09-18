# ListenUp server — node:20-alpine (segfault 회피 목적)
FROM node:20-alpine

WORKDIR /app

# 루트 워크스페이스 의존성 설치 (tsx 등은 루트 node_modules에 있음)
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev 2>/dev/null || npm install --omit=dev

# 서버 패키지 복사
COPY packages/server/package.json ./packages/server/
RUN cd packages/server && npm install --omit=dev

# 서버 소스 복사
COPY packages/server/src ./packages/server/src
COPY packages/server/tsconfig.json* ./packages/server/

WORKDIR /app/packages/server

EXPOSE 3000

# tsx로 TypeScript 직접 실행
CMD ["npx", "tsx", "src/index.ts"]