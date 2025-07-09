# 멀티 스테이지 빌드
FROM node:18-alpine AS builder

# 작업 디렉토리 설정
WORKDIR /app

# 패키지 파일 복사
COPY package*.json ./
COPY frontend/package*.json ./frontend/
COPY backend/package*.json ./backend/

# 의존성 설치
RUN npm ci --only=production

# 소스 코드 복사
COPY . .

# 프론트엔드 빌드
RUN npm run build

# 프로덕션 스테이지
FROM node:18-alpine AS production

# 작업 디렉토리 설정
WORKDIR /app

# 필요한 파일들만 복사
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/frontend/dist ./frontend/dist
COPY --from=builder /app/backend/package*.json ./backend/
COPY --from=builder /app/package*.json ./

# 백엔드 프로덕션 의존성만 설치
RUN cd backend && npm ci --only=production

# 포트 노출
EXPOSE 3000

# 애플리케이션 실행
CMD ["npm", "run", "start"]