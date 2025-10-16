import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

/**
 * Socket.IO 연결 초기화
 * @returns Socket
 */
export function initSocket(): Socket {
  if (!socket) {
    socket = io("http://localhost:3000", {
      autoConnect: false,
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
