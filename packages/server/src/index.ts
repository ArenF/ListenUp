import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import { config, validateEnvYouTube } from "./config/env.js";
import { youtubeService } from "./services/youtube.js";
import { playlistService } from "./services/playlist.js";
import { registerRoomHandlers } from "./socket/handlers/room.handler.js";
import { registerGameHandlers } from "./socket/handlers/game.handler.js";
import playlists from "./data/playlists.json" with { type: "json" };

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
  },
  pingTimeout: 60000,        // 60초 타임아웃
  pingInterval: 25000,       // 25초마다 핑
  transports: ["websocket", "polling"],  // WebSocket 우선, 폴백으로 polling
});

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({
    message: "ListenUp! Server is running!",
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

// 테스트용 플레이리스트 목록
app.get("/api/test/playlists", (_req, res) => {
  res.json(playlists);
});

// 테스트용 플레이리스트 트랙 조회
app.get("/api/test/playlist/:playlistId", async (req, res) => {
  try {
    const { playlistId } = req.params;
    const playlist = (playlists as any)[playlistId];

    if (!playlist) {
      return res.status(404).json({ error: "Playlist not found" });
    }

    if (!playlist.tracks || playlist.tracks.length === 0) {
      return res.json({
        playlist: {
          id: playlist.id,
          name: playlist.name,
          description: playlist.description,
        },
        tracks: [],
        message: "No tracks in this playlist yet",
      });
    }

    // playlist.tracks 배열에서 videoId만 추출
    const videoIds = playlist.tracks.map((track: any) => track.videoId);
    const tracks = await youtubeService.getTracks(videoIds);

    return res.json({
      playlist: {
        id: playlist.id,
        name: playlist.name,
        description: playlist.description,
      },
      tracks,
      stats: {
        total: playlist.tracks.length,
        retrieved: tracks.length,
        filtered: playlist.tracks.length - tracks.length,
      },
    });
  } catch (err: any) {
    console.error("Error fetching playlist:", err);
    return res.status(500).json({
      error: "Failed to fetch playlist",
      message: err.message,
    });
  }
});

// 테스트용 단일 트랙 조회
app.get("/api/test/track/:trackId", async (req, res) => {
  try {
    const { trackId } = req.params;
    const track = await youtubeService.getTrack(trackId);

    if (!track) {
      return res.status(404).json({
        error: "Track not found or unavailable",
      });
    }

    return res.json(track);
  } catch (error: any) {
    console.error("Error fetching track:", error);
    return res.status(500).json({
      error: "Failed to fetch track",
      message: error.message,
    });
  }
});

// 테스트용 캐시 통계
app.get("/api/test/cache-stats", (_req, res) => {
  res.json(youtubeService.getCacheStats());
});

// ============================================================================
// 플레이리스트 관리 API
// ============================================================================

// 모든 플레이리스트 조회
app.get("/api/playlists", (_req, res) => {
  try {
    const allPlaylists = playlistService.getAllPlaylists();
    res.json(allPlaylists);
  } catch (error: any) {
    console.error("Error fetching playlists:", error);
    res.status(500).json({ error: "Failed to fetch playlists" });
  }
});

// 특정 플레이리스트 조회
app.get("/api/playlists/:id", (req, res) => {
  try {
    const { id } = req.params;
    const playlist = playlistService.getPlaylist(id);

    if (!playlist) {
      return res.status(404).json({ error: "Playlist not found" });
    }

    return res.json(playlist);
  } catch (error: any) {
    console.error("Error fetching playlist:", error);
    return res.status(500).json({ error: "Failed to fetch playlist" });
  }
});

// 플레이리스트 생성
app.post("/api/playlists", async (req, res) => {
  try {
    const { name, description, tracks } = req.body;

    if (!name || typeof name !== "string") {
      return res.status(400).json({ error: "Playlist name is required" });
    }

    const result = await playlistService.createPlaylist(
      name,
      description || "",
      tracks || []
    );

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    return res.status(201).json(result.playlist);
  } catch (error: any) {
    console.error("Error creating playlist:", error);
    return res.status(500).json({ error: "Failed to create playlist" });
  }
});

// 플레이리스트 수정
app.put("/api/playlists/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, tracks } = req.body;

    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (tracks !== undefined) updates.tracks = tracks;

    const result = await playlistService.updatePlaylist(id, updates);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    return res.json(result.playlist);
  } catch (error: any) {
    console.error("Error updating playlist:", error);
    return res.status(500).json({ error: "Failed to update playlist" });
  }
});

// 플레이리스트 삭제
app.delete("/api/playlists/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await playlistService.deletePlaylist(id);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    return res.json({ message: "Playlist deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting playlist:", error);
    return res.status(500).json({ error: "Failed to delete playlist" });
  }
});

// 플레이리스트에 트랙 추가
app.post("/api/playlists/:id/tracks", async (req, res) => {
  try {
    const { id } = req.params;
    const { videoId, answers, hints } = req.body;

    if (!videoId || typeof videoId !== "string") {
      return res.status(400).json({ error: "Video ID is required" });
    }

    const result = await playlistService.addTrack(
      id,
      videoId,
      answers || [],
      hints
    );

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    return res.json(result.playlist);
  } catch (error: any) {
    console.error("Error adding track:", error);
    return res.status(500).json({ error: "Failed to add track" });
  }
});

// 플레이리스트에서 트랙 제거
app.delete("/api/playlists/:id/tracks/:videoId", async (req, res) => {
  try {
    const { id, videoId } = req.params;

    const result = await playlistService.removeTrack(id, videoId);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    return res.json(result.playlist);
  } catch (error: any) {
    console.error("Error removing track:", error);
    return res.status(500).json({ error: "Failed to remove track" });
  }
});

// 플레이리스트 트랙의 정답 및 힌트 수정
app.put("/api/playlists/:id/tracks/:videoId", async (req, res) => {
  try {
    const { id, videoId } = req.params;
    const { answers, hints } = req.body;

    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ error: "Answers array is required" });
    }

    const result = await playlistService.updateTrack(id, videoId, answers, hints);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    return res.json(result.playlist);
  } catch (error: any) {
    console.error("Error updating track:", error);
    return res.status(500).json({ error: "Failed to update track" });
  }
});

// YouTube 트랙 정보 조회 (플레이리스트 관리용)
app.get("/api/youtube/track/:trackId", async (req, res) => {
  try {
    const { trackId } = req.params;
    const track = await youtubeService.getTrack(trackId);

    if (!track) {
      return res.status(404).json({ error: "Track not found or unavailable" });
    }

    return res.json(track);
  } catch (error: any) {
    console.error("Error fetching YouTube track:", error);
    return res.status(500).json({ error: "Failed to fetch track" });
  }
});

//소켓 연결
io.on("connection", (socket) => {
  console.log(`✅ Client connected: ${socket.id}`);

  // 방 관리 핸들러 등록
  registerRoomHandlers(io, socket);

  // 게임 핸들러 등록
  registerGameHandlers(io, socket);

  socket.on("disconnect", () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
  });
});

// 초기화 및 서버 시작
async function startServer() {
  validateEnvYouTube();

  // 플레이리스트 서비스 초기화
  await playlistService.initialize();

  httpServer.listen(config.server.port, () => {
    console.log(`Server running on http://localhost:${config.server.port}`);
    console.log(`Socket.IO Ready`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
