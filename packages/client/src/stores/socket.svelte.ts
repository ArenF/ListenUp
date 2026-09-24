import { io, Socket } from "socket.io-client";
import type {
  AckResponse,
  ClientToServerEvents,
  ServerToClientEvents,
} from "../types/socketEvents";

/**
 * 서버와의 Socket.IO 연결 (앱 전체에 하나)
 *
 * 다른 store는 여기서 만든 `socket`에 이벤트를 등록하고 `request()`로 요청을 보낸다.
 * 서버에서 오는 이벤트는 타입을 지정하고, 보내는 이벤트는 열어 둔다.
 * 보내는 쪽은 요청마다 ack 형태가 달라 request()에서 개별로 좁힌다.
 */
export type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

// 개발 환경: Vite 프록시 사용 (빈 문자열로 상대 경로)
// 프로덕션: 환경변수로 서버 URL 지정
export const socket: AppSocket = io(import.meta.env.VITE_SERVER_URL || "", {
  autoConnect: false,
  path: "/socket.io",
});

// 개발 중 콘솔에서 소켓을 직접 만져볼 수 있게 열어둔다
if (import.meta.env.DEV) {
  (window as Window & { socket?: AppSocket }).socket = socket;
}

/** 연결 상태와 상단 상태바에 보여줄 메시지 */
class ConnectionStore {
  socketId = $state("");
  connected = $state(false);
  statusMessage = $state("서버에 연결되지 않음");
}

export const connection = new ConnectionStore();

socket.on("connect", () => {
  connection.connected = true;
  connection.socketId = socket.id ?? "";
  connection.statusMessage = `✅ 서버 연결 성공! (ID: ${socket.id})`;
  console.log("서버 연결:", socket.id);
});

socket.on("disconnect", () => {
  connection.connected = false;
  connection.socketId = "";
  connection.statusMessage = "❌ 서버 연결 끊김";
  console.log("서버 연결 해제");
});

socket.on("connect_error", (error) => {
  connection.statusMessage = `❌ 연결 실패: ${error.message}`;
  console.error("연결 에러:", error);
});

export function connect() {
  socket.connect();
}

export function disconnect() {
  socket.disconnect();
}

interface RequestHandlers<T> {
  /** 실패 메시지 앞에 붙일 문구 (예: "방 생성 실패") */
  failMessage: string;
  onSuccess?: (result: T) => void;
}

/**
 * 소켓 요청을 보내고 ack 응답을 처리한다.
 * 실패하면 사유를 상태바 메시지에 남긴다.
 *
 * @typeParam T 성공했을 때 응답에 함께 실려오는 값
 */
export function request<T = unknown>(
  event: string,
  payload: unknown,
  { failMessage, onSuccess }: RequestHandlers<T>
) {
  socket.emit(event, payload, (response: AckResponse<T>) => {
    if (response.success) {
      onSuccess?.(response);
      return;
    }

    connection.statusMessage = response.error
      ? `❌ ${failMessage}: ${response.error}`
      : `❌ ${failMessage}`;
    console.error(`${failMessage}:`, response.error);
  });
}
