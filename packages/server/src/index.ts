import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import { config, validateEnvSpotify } from "./config/env";
import { spotifyService } from "./services/spotify";
import playlists from "./data/playlists.json";

dotenv.config({ path: "../../.env" });

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

app.get("/", (req, res) => {
  res.json({
    message: "Litenp! Server is running!",
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

// 테스트용 플레이리스트 목록
app.get("/api/test/playlists", (req, res) => {
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

    if (playlist.trackids.length === 0) {
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

    const tracks = await spotifyService.getTracks(playlist.trackIds);

    res.json({
      playlist: {
        id: playlist.id,
        name: playlist.name,
        descripion: playlist.description,
      },
      tracks,
      stats: {
        totla: playlist.trackIds.length,
        withPreview: tracks.length,
        filtered: playlist.trackIds.length - tracks.length,
      },
    });
  } catch (err: any) {
    console.error("Error fetching playlist:", err);
    res.status(500).json({
      error: "Failed to fetch playlist",
      message: err.message,
    });
  }
});

// 테스트용 단일 트랙 조회
app.get("/api/test/track/:trackId", async (req, res) => {
  try {
    const { trackId } = req.params;
    const track = await spotifyService.getTrack(trackId);

    if (!track) {
      return res.status(404).json({
        error: "Track not found or no preview available",
      });
    }

    res.json();
  } catch (error: any) {
    console.error("Error fetching track:", error);
    res.status(500).json({
      error: "Failed to fetch track",
      message: error.message,
    });
  }
});

// 테스트용 Spotify 캐시 통계
app.get("/api/test/cache-stats", (req, res) => {
  res.json(spotifyService.getCacheStats());
});

//소켓 연결
io.on("connection", (socket) => {
  console.log(`Client connected : ${socket.id}`);

  socket.on("disconnect", () => {
    console.log(`Client Disconnected : ${socket.id}`);
  });
});

validateEnvSpotify();

httpServer.listen(config.port, () => {
  console.log(`Server running on http://localhost:${config.port}`);
  console.log(`Socket.IO Ready`);
});
