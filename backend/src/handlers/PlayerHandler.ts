import { Server, Socket } from "socket.io";

const players = new Map();

type PlayerData = {
  id: string;
  name: string;
  currentRoom: string;
  isHost: boolean;
  score: number;
  totalScore: number;
  isReady: boolean;
  lastActivity: number;
  socketRef: Socket | null;
};

const createPlayerData = (socketId: string): PlayerData => {
  return {
    id: socketId,
    name: "",
    currentRoom: "",
    isHost: false,
    score: 0,
    totalScore: 0,
    isReady: false,
    lastActivity: Date.now(),
    socketRef: null,
  };
};

const registerPlayer = (io: Server, socket: Socket) => {
  const playerId: string = socket.id;
  const playerData = createPlayerData(playerId);

  players.set(playerId, playerData);

  console.log(`✅ Player registered: ${playerId}`);
  console.log(`📊 Total players: ${players.size}`);

  // 클라이언트에 등록 완료 알림
  socket.emit("player:registered", {
    playerId: playerId,
    timestamp: Date.now(),
  });
};

// 연결이 끊길 때 사용
const disconnectPlayer = (io: Server, socket: Socket) => {
  const playerId = socket.id;
  const player = players.get(playerId);

  if (!player) {
    console.log(`⚠️ Player not found for disconnect: ${playerId}`);
    return;
  }

  console.log(
    `🔌 Player disconnecting: ${playerId} (${player.name || "Anonymous"})`
  );

  // 방에 속해있다면 방에서 제거 알림
  if (player.currentRoom) {
    socket.to(player.currentRoom).emit("player:left", {
      playerId: playerId,
      playerName: player.name,
      wasHost: player.isHost,
      timestamp: Date.now(),
    });
  }

  // 플레이어 데이터 제거
  players.delete(playerId);

  console.log(`❌ Player removed: ${playerId}`);
  console.log(`📊 Remaining players: ${players.size}`);
};

// setName:player 소켓이 클라이언트로 부터 전달될 때 그 데이터를 받고 이름을 변경
const setPlayerName = (io: Server, socket: Socket) => {
  socket.on("player:setName", (data) => {
    const playerId = socket.id;
    const player = players.get(playerId);

    // 에러 처리
    if (!player) {
      socket.emit("error", { message: "Player not found" });
      return;
    }

    const { name } = data;

    if (name.length > 20) {
      socket.emit("error", { message: "Name too long (max 20 characters)" });
      return;
    }

    player.name = name;
    player.lastActivity = Date.now();

    console.log(`📝 Player name set: ${playerId} -> "${player.name}"`);

    // 클라이언트에 확인
    socket.emit("player:nameSet", {
      playerId: playerId,
      name: player.name,
      timestamp: Date.now(),
    });

    // 같은 방에 있는 다른 플레이어들에게 알림
    if (player.currentRoom) {
      socket.to(player.currentRoom).emit("player:nameUpdated", {
        playerId: playerId,
        name: player.name,
        timestamp: Date.now(),
      });
    }
  });
};

/**
 * 플레이어 정보 조회
 */
const getPlayerInfo = (io: Server, socket: Socket) => {
  socket.on("player:getInfo", () => {
    const playerId = socket.id;
    const player = players.get(playerId);

    if (!player) {
      socket.emit("error", { message: "Player not found" });
      return;
    }

    // 민감한 정보 제외하고 전송
    const playerInfo = {
      id: player.id,
      name: player.name,
      currentRoom: player.currentRoom,
      isHost: player.isHost,
      score: player.score,
      isReady: player.isReady,
    };

    socket.emit("player:info", playerInfo);
  });
};

/**
 *
 * 플레이어 상태 동기화(Room 내부의 플레이어들과 동기화 관련된 함수들)
 *
 *
 */

/**
 * 플레이어 준비 상태 토글
 */
const togglePlayerReady = (io: Server, socket: Socket) => {
  socket.on("player:toggleReady", () => {
    const playerId = socket.id;
    const player = players.get(playerId);

    if (!player) {
      socket.emit("error", { message: "Player not found" });
      return;
    }

    if (!player.currentRoom) {
      socket.emit("error", { message: "Not in a room" });
      return;
    }

    // 준비 상태 토글
    player.isReady = !player.isReady;
    player.lastActivity = Date.now();

    console.log(`🎮 Player ready status: ${playerId} -> ${player.isReady}`);

    // 방의 모든 플레이어에게 알림
    io.to(player.currentRoom).emit("player:readyChanged", {
      playerId: playerId,
      isReady: player.isReady,
      timestamp: Date.now(),
    });
  });
};

/*
 *  플레이어 핸들러 관련 유틸 함수들
 * (id call Player, room call Players, call all players ...)
 */

const getPlayer = (playerId: string) => {
  return players.get(playerId);
};

const getAllPlayer = () => {
  return Array.from(players.values());
};

const getPlayerInRoom = (roomCode: string) => {
  return Array.from(players.values()).filter(
    (player) => player.currentRoom === roomCode
  );
};

const updatePlayerRoom = (
  playerId: string,
  roomCode: string,
  isHost: boolean = false
) => {
  const player = players.get(playerId);
  if (player) {
    player.currentRoom = roomCode;
    player.isHost = isHost;
    player.lastActivity = Date.now();
    return true;
  }
  return false;
};

const removePlayerFromRoom = (playerId: string) => {
  const player = players.get(playerId);
  if (player) {
    player.currentRoom = null;
    player.isHost = false;
    player.isReady = false;
    player.score = 0;
    player.lastActivity = Date.now();
    return true;
  }
  return false;
};

// 플레이어 핸들러 객체
const PlayerHandler = (io: Server, socket: Socket) => {
  //플레이어 등록 (연결 시)
  registerPlayer(io, socket);

  //플레이어 관련 리스너 등록
  setPlayerName(io, socket);
  getPlayerInfo(io, socket);
  togglePlayerReady(io, socket);

  socket.on("disconnect", () => {
    disconnectPlayer(io, socket);
  });
};

export default PlayerHandler;

export {
  getPlayer,
  getPlayerInRoom,
  getAllPlayer,
  updatePlayerRoom,
  removePlayerFromRoom,
};
