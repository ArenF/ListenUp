import { Server, Socket } from "socket.io";

const ROOM_CONFIG = {
  MAX_PLAYERS: 8,
  CODE_LENGTH: 8,
  MAX_CODE_ATTEMPTS: 10,
};

// roomData 타입 정하기
type RoomData = {
  code: string;
  host: string;
  players: [string];
  maxPlayers: number;
  gameState: "waiting" | "playing" | "finished";
  category: any;
  currentRound: number;
  totalRounds: number;
  createdAt: number;
  lastActivity: number;
  settings: {
    isPrivate: boolean;
    allowSpectators: boolean;
  };
};

// key: roomCode, value: RoomData
const rooms = new Map();

const createRoomCode = (roomCode: string, hostId: string): RoomData => {
  return {
    code: roomCode,
    host: hostId,
    players: [hostId],
    maxPlayers: ROOM_CONFIG.MAX_PLAYERS,
    gameState: "waiting",
    category: null,
    currentRound: 0,
    totalRounds: 10,
    createdAt: Date.now(),
    lastActivity: Date.now(),
    settings: {
      isPrivate: false,
      allowSpectators: true,
    },
  };
};

const createRoom = (io: Server, socket: Socket) => {
  socket.on("room:create", (data) => {});
};

const RoomHandler = (io: Server, socket: Socket) => {};

export default RoomHandler;
