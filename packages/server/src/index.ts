import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import { config, validateEnvYouTube } from "./config/env.js";
import { youtubeService } from "./services/youtube.js";
import { registerRoomHandlers } from "./socket/handlers/room.handler.js";
import playlists from "./data/playlists.json" with { type: "json" };

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
  },
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

    if (playlist.trackIds.length === 0) {
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

    const tracks = await youtubeService.getTracks(playlist.trackIds);

    return res.json({
      playlist: {
        id: playlist.id,
        name: playlist.name,
        description: playlist.description,
      },
      tracks,
      stats: {
        total: playlist.trackIds.length,
        retrieved: tracks.length,
        filtered: playlist.trackIds.length - tracks.length,
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

//소켓 연결
io.on("connection", (socket) => {
  console.log(`✅ Client connected: ${socket.id}`);

  // 방 관리 핸들러 등록
  registerRoomHandlers(io, socket);

  socket.on("disconnect", () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
  });
});

validateEnvYouTube();

httpServer.listen(config.server.port, () => {
  console.log(`Server running on http://localhost:${config.server.port}`);
  console.log(`Socket.IO Ready`);
});
