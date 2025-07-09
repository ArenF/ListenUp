import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// ES modules에서 __dirname 대체
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? false 
      : ["http://localhost:5173", "https://*.githubpreview.dev"],
    methods: ["GET", "POST"],
    credentials: true
  }
});

const PORT = process.env.PORT || 3000;

// 미들웨어 설정
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? false 
    : ["http://localhost:5173", "https://*.githubpreview.dev"],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 정적 파일 제공 (프로덕션 환경에서)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../frontend/dist')));
}

// API 라우트
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/api/users', (req, res) => {
  res.json([
    { id: 1, name: 'John Doe', email: 'john@example.com' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
  ]);
});

// Socket.IO 이벤트 핸들링
io.on('connection', (socket) => {
  console.log(`사용자 연결됨: ${socket.id}`);
  
  // 클라이언트에 환영 메시지 전송
  socket.emit('welcome', {
    message: 'Socket.IO 서버에 연결되었습니다!',
    socketId: socket.id
  });

  // 메시지 브로드캐스트
  socket.on('message', (data) => {
    console.log('받은 메시지:', data);
    // 모든 클라이언트에게 메시지 전송
    io.emit('message', {
      ...data,
      timestamp: new Date().toISOString(),
      socketId: socket.id
    });
  });

  // 채팅방 입장
  socket.on('join_room', (roomId) => {
    socket.join(roomId);
    socket.emit('room_joined', { roomId });
    socket.to(roomId).emit('user_joined', { 
      message: `사용자 ${socket.id}가 방에 입장했습니다.`,
      socketId: socket.id 
    });
  });

  // 채팅방 메시지
  socket.on('room_message', (data) => {
    socket.to(data.room).emit('room_message', {
      ...data,
      timestamp: new Date().toISOString(),
      socketId: socket.id
    });
  });

  // 연결 해제
  socket.on('disconnect', () => {
    console.log(`사용자 연결 해제됨: ${socket.id}`);
  });
});

// 프로덕션 환경에서 SPA 라우팅 처리
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/dist/index.html'));
  });
}

server.listen(PORT, () => {
  console.log(`🚀 서버가 포트 ${PORT}에서 실행 중입니다.`);
  console.log(`🌐 환경: ${process.env.NODE_ENV || 'development'}`);
  if (process.env.NODE_ENV !== 'production') {
    console.log(`📡 Socket.IO 서버 준비 완료`);
  }
});