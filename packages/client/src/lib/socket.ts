import { io, Socket } from "socket.io-client";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from "./socketEvents";

/**
 * 서버에서 오는 이벤트는 타입을 지정하고, 보내는 이벤트는 열어 둔다.
 * 보내는 쪽은 요청마다 ack 형태가 달라 `gameActions`의 request()에서 개별로 좁힌다.
 */
export type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: AppSocket | null = null;

/**
 * Socket.IO 연결 초기화
 * @returns Socket
 */
export function initSocket(): AppSocket {
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
export function getSocket(): AppSocket | null {
  return socket;
}
