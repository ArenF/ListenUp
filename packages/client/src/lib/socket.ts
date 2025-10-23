import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

/**
 * Socket.IO 연결 초기화
 * @returns Socket
 */
export function initSocket(): Socket {
  if (!socket) {
    // 개발 환경: Vite 프록시 사용 (빈 문자열로 상대 경로)
    // 프로덕션: 환경변수로 서버 URL 지정
    const serverUrl = import.meta.env.VITE_SERVER_URL || "";

    socket = io(serverUrl, {
      autoConnect: false,
      path: "/socket.io",
    });
  }

  return socket;
}

/**
 * 현재 Socket 인스턴스 반환
 * @returns Socket | null
 */
export function getSocket(): Socket | null {
  return socket;
}
