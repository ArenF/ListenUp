import { describe, it, expect, beforeEach } from "vitest";
import { GameService } from "../services/game.js";
import { RoomService } from "../services/room.js";
import type { Room, Track, RoomSettings } from "../types/index.js";

describe("GameService", () => {
  let gameService: GameService;
  let roomService: RoomService;
  let testRoom: Room;

  const testSettings: RoomSettings = {
    maxPlayers: 8,
    roundInterval: 30,
    playlistId: "test-playlist",
  };

  const testTracks: Track[] = [
    {
      id: "track1",
      name: "Dynamite",
      artist: "BTS",
      uploadDate: "2020-08-21",
      year: "2020",
      embedUrl: "https://www.youtube.com/embed/gdZLi9oWNZg",
      duration: 199,
      startSeconds: 0,
      endSeconds: 30,
      answers: ["Dynamite", "다이너마이트"],
    },
    {
      id: "track2",
      name: "Butter",
      artist: "BTS",
      uploadDate: "2021-05-21",
      year: "2021",
      embedUrl: "https://www.youtube.com/embed/WMweEpGlu_U",
      duration: 164,
      startSeconds: 0,
      endSeconds: 30,
      answers: ["Butter", "버터"],
    },
  ];

  beforeEach(() => {
    gameService = new GameService();
    roomService = new RoomService();
    testRoom = roomService.createRoom("host1", "TestHost", testSettings);
  });

  describe("startGame", () => {
    it("should start game successfully", () => {
      const result = gameService.startGame(testRoom);

      expect(result.success).toBe(true);
      expect(result.gameState).toBeDefined();
      expect(testRoom.gameState.isPlaying).toBe(true);
      expect(testRoom.gameState.currentRound).toBe(0);
      expect(testRoom.gameState.totalRounds).toBe(3);
    });

    it("should reject if game already started", () => {
      gameService.startGame(testRoom);
      const result = gameService.startGame(testRoom);

      expect(result.success).toBe(false);
      expect(result.error).toBe("이미 게임이 진행 중입니다");
    });

    it("should reject if no players", () => {
      const emptyRoom = roomService.createRoom("host2", "EmptyHost", testSettings);
      emptyRoom.players.clear();

      const result = gameService.startGame(emptyRoom);

      expect(result.success).toBe(false);
      expect(result.error).toBe("게임을 시작하려면 최소 1명의 플레이어가 필요합니다");
    });

    it("should initialize all player scores to 0", () => {
      roomService.joinRoom(testRoom.code, "player2", "Player2");
      roomService.joinRoom(testRoom.code, "player3", "Player3");

      gameService.startGame(testRoom);

      expect(testRoom.gameState.scores.get("host1")).toBe(0);
      expect(testRoom.gameState.scores.get("player2")).toBe(0);
      expect(testRoom.gameState.scores.get("player3")).toBe(0);
    });
  });

  describe("startRound", () => {
    beforeEach(() => {
      gameService.startGame(testRoom);
    });

    it("should start round successfully", () => {
      const result = gameService.startRound(testRoom, testTracks);

      expect(result.success).toBe(true);
      expect(result.track).toBeDefined();
      expect(result.roundNumber).toBe(1);
      expect(testRoom.gameState.currentRound).toBe(1);
      expect(testRoom.gameState.currentTrack).toBeDefined();
    });

    it("should reject if game not started", () => {
      const newRoom = roomService.createRoom("host3", "NewHost", testSettings);
      const result = gameService.startRound(newRoom, testTracks);

      expect(result.success).toBe(false);
      expect(result.error).toBe("게임이 시작되지 않았습니다");
    });

    it("should reject if no tracks available", () => {
      const result = gameService.startRound(testRoom, []);

      expect(result.success).toBe(false);
      expect(result.error).toBe("재생할 트랙이 없습니다");
    });

    it("should increment round number", () => {
      gameService.startRound(testRoom, testTracks);
      expect(testRoom.gameState.currentRound).toBe(1);

      gameService.endRound(testRoom);
      gameService.startRound(testRoom, testTracks);
      expect(testRoom.gameState.currentRound).toBe(2);
    });

    it("should reject if all rounds completed", () => {
      // Complete all 3 rounds
      for (let i = 0; i < 3; i++) {
        gameService.startRound(testRoom, testTracks);
        gameService.endRound(testRoom);
      }

      const result = gameService.startRound(testRoom, testTracks);
      expect(result.success).toBe(false);
      expect(result.error).toBe("모든 라운드가 완료되었습니다");
    });
  });

  describe("submitAnswer", () => {
    beforeEach(() => {
      gameService.startGame(testRoom);
      gameService.startRound(testRoom, testTracks);
    });

    it("should accept correct answer", () => {
      const currentTrack = testRoom.gameState.currentTrack!;
      const result = gameService.submitAnswer(testRoom, "host1", currentTrack.name);

      expect(result.success).toBe(true);
      expect(result.result?.isCorrect).toBe(true);
      expect(result.result?.score).toBeGreaterThan(0);
    });

    it("should reject incorrect answer but record it", () => {
      const result = gameService.submitAnswer(testRoom, "host1", "Wrong Answer");

      expect(result.success).toBe(true);
      expect(result.result?.isCorrect).toBe(false);
      expect(result.result?.score).toBe(0);
    });

    it("should accept similar answers (case insensitive)", () => {
      const currentTrack = testRoom.gameState.currentTrack!;
      const result = gameService.submitAnswer(
        testRoom,
        "host1",
        currentTrack.name.toLowerCase()
      );

      expect(result.success).toBe(true);
      expect(result.result?.isCorrect).toBe(true);
    });

    it("should reject if player already submitted", () => {
      gameService.submitAnswer(testRoom, "host1", "First Answer");
      const result = gameService.submitAnswer(testRoom, "host1", "Second Answer");

      expect(result.success).toBe(false);
      expect(result.error).toBe("이미 답안을 제출했습니다");
    });

    it("should update streak on consecutive correct answers", () => {
      // Round 1
      gameService.submitAnswer(testRoom, "host1", testRoom.gameState.currentTrack!.name);
      expect(testRoom.gameState.streaks.get("host1")).toBe(1);

      // Round 2
      gameService.endRound(testRoom);
      gameService.startRound(testRoom, testTracks);
      gameService.submitAnswer(testRoom, "host1", testRoom.gameState.currentTrack!.name);
      expect(testRoom.gameState.streaks.get("host1")).toBe(2);
    });

    it("should reset streak on wrong answer", () => {
      // Correct answer
      gameService.submitAnswer(testRoom, "host1", testRoom.gameState.currentTrack!.name);
      expect(testRoom.gameState.streaks.get("host1")).toBe(1);

      // Wrong answer
      gameService.endRound(testRoom);
      gameService.startRound(testRoom, testTracks);
      gameService.submitAnswer(testRoom, "host1", "Wrong Answer");
      expect(testRoom.gameState.streaks.get("host1")).toBe(0);
    });

    it("should calculate score based on time", async () => {
      // First player submits immediately
      const result1 = gameService.submitAnswer(testRoom, "host1", testRoom.gameState.currentTrack!.name);

      // Add second player
      testRoom.gameState.isPlaying = false;
      roomService.joinRoom(testRoom.code, "player2", "Player2");
      gameService.startGame(testRoom);
      gameService.startRound(testRoom, testTracks);

      // Simulate delay for second player
      await new Promise(resolve => setTimeout(resolve, 100));

      const result2 = gameService.submitAnswer(testRoom, "player2", testRoom.gameState.currentTrack!.name);

      // Earlier submission should have higher score
      expect(result1.result!.score).toBeGreaterThan(result2.result!.score);
    });
  });

  describe("endRound", () => {
    beforeEach(() => {
      gameService.startGame(testRoom);
      gameService.startRound(testRoom, testTracks);
    });

    it("should end round successfully", () => {
      const result = gameService.endRound(testRoom);

      expect(result.success).toBe(true);
      expect(result.result).toBeDefined();
      expect(result.result?.roundNumber).toBe(1);
      expect(testRoom.gameState.currentTrack).toBeNull();
    });

    it("should collect all player answers", () => {
      // Create new room with 2 players from the start
      const multiRoom = roomService.createRoom("host", "Host", testSettings);
      roomService.joinRoom(multiRoom.code, "player2", "Player2");

      // Start game
      gameService.startGame(multiRoom);
      gameService.startRound(multiRoom, testTracks);

      gameService.submitAnswer(multiRoom, "host", multiRoom.gameState.currentTrack!.name);
      gameService.submitAnswer(multiRoom, "player2", "Wrong Answer");

      const result = gameService.endRound(multiRoom);

      expect(result.result?.answers.length).toBe(2);
    });

    it("should reject if game not started", () => {
      const newRoom = roomService.createRoom("host4", "NewHost", testSettings);
      const result = gameService.endRound(newRoom);

      expect(result.success).toBe(false);
      expect(result.error).toBe("게임이 진행 중이 아닙니다");
    });
  });

  describe("endGame", () => {
    beforeEach(() => {
      gameService.startGame(testRoom);
      gameService.startRound(testRoom, testTracks);
    });

    it("should end game successfully", () => {
      const result = gameService.endGame(testRoom);

      expect(result.success).toBe(true);
      expect(result.result).toBeDefined();
      expect(testRoom.gameState.isPlaying).toBe(false);
    });

    it("should determine winner correctly", () => {
      roomService.joinRoom(testRoom.code, "player2", "Player2");

      // Host gets correct answer
      gameService.submitAnswer(testRoom, "host1", testRoom.gameState.currentTrack!.name);
      // Player2 gets wrong answer
      gameService.submitAnswer(testRoom, "player2", "Wrong Answer");

      const result = gameService.endGame(testRoom);

      expect(result.result?.winner).toBeDefined();
      expect(result.result?.winner?.playerId).toBe("host1");
    });

    it("should sort final scores correctly", () => {
      // Create new room with multiple players
      const multiRoom = roomService.createRoom("host", "Host", testSettings);
      roomService.joinRoom(multiRoom.code, "player2", "Player2");
      roomService.joinRoom(multiRoom.code, "player3", "Player3");

      // Start game with all players
      gameService.startGame(multiRoom);
      gameService.startRound(multiRoom, testTracks);

      // Set different scores manually
      multiRoom.gameState.scores.set("host", 800);
      multiRoom.gameState.scores.set("player2", 500);
      multiRoom.gameState.scores.set("player3", 1500);

      const result = gameService.endGame(multiRoom);

      expect(result.result?.finalScores[0].playerId).toBe("player3");
      expect(result.result?.finalScores[0].score).toBe(1500);
      expect(result.result?.finalScores[1].playerId).toBe("host");
      expect(result.result?.finalScores[2].playerId).toBe("player2");
    });

    it("should save game to history", () => {
      const historyBefore = gameService.getGameHistory().length;
      gameService.endGame(testRoom);
      const historyAfter = gameService.getGameHistory().length;

      expect(historyAfter).toBe(historyBefore + 1);
    });

    it("should reset game state", () => {
      gameService.endGame(testRoom);

      expect(testRoom.gameState.isPlaying).toBe(false);
      expect(testRoom.gameState.currentRound).toBe(0);
      expect(testRoom.gameState.currentTrack).toBeNull();
      expect(testRoom.gameState.answers.size).toBe(0);
    });
  });

  describe("Answer checking algorithm", () => {
    beforeEach(() => {
      gameService.startGame(testRoom);
      // Manually set a track for testing
      testRoom.gameState.currentTrack = testTracks[0];
      testRoom.gameState.roundStartTime = Date.now();
    });

    it("should accept exact match", () => {
      const result = gameService.submitAnswer(testRoom, "host1", "Dynamite");
      expect(result.result?.isCorrect).toBe(true);
    });

    it("should accept case insensitive match", () => {
      const result = gameService.submitAnswer(testRoom, "host1", "dynamite");
      expect(result.result?.isCorrect).toBe(true);
    });

    it("should accept match with extra spaces", () => {
      const result = gameService.submitAnswer(testRoom, "host1", " Dynamite ");
      expect(result.result?.isCorrect).toBe(true);
    });

    it("should accept match with special characters removed", () => {
      const result = gameService.submitAnswer(testRoom, "host1", "Dyna-mite!");
      expect(result.result?.isCorrect).toBe(true);
    });

    it("should reject completely wrong answer", () => {
      const result = gameService.submitAnswer(testRoom, "host1", "Wrong Song");
      expect(result.result?.isCorrect).toBe(false);
    });

    it("should accept partial match if long enough", () => {
      const result = gameService.submitAnswer(testRoom, "host1", "Dyna");
      expect(result.result?.isCorrect).toBe(true);
    });

    it("should reject very short partial match", () => {
      const result = gameService.submitAnswer(testRoom, "host1", "Dy");
      expect(result.result?.isCorrect).toBe(false);
    });
  });

  describe("Score calculation", () => {
    beforeEach(() => {
      gameService.startGame(testRoom);
      gameService.startRound(testRoom, testTracks);
    });

    it("should give higher score for faster answer", () => {
      // Fast answer (1 second ago)
      testRoom.gameState.roundStartTime = Date.now() - 1000;
      const result1 = gameService.submitAnswer(testRoom, "host1", testRoom.gameState.currentTrack!.name);
      const score1 = result1.result!.score;

      // Create new room for second test
      const testRoom2 = roomService.createRoom("host2", "TestHost2", testSettings);
      gameService.startGame(testRoom2);
      gameService.startRound(testRoom2, testTracks);

      // Slow answer (10 seconds ago)
      testRoom2.gameState.roundStartTime = Date.now() - 10000;
      const result2 = gameService.submitAnswer(testRoom2, "host2", testRoom2.gameState.currentTrack!.name);
      const score2 = result2.result!.score;

      expect(score1).toBeGreaterThan(score2);
    });

    it("should add streak bonus", () => {
      // First correct answer
      const result1 = gameService.submitAnswer(testRoom, "host1", testRoom.gameState.currentTrack!.name);
      const score1 = result1.result!.score;

      // Second correct answer (with streak)
      gameService.endRound(testRoom);
      gameService.startRound(testRoom, testTracks);
      const result2 = gameService.submitAnswer(testRoom, "host1", testRoom.gameState.currentTrack!.name);
      const score2 = result2.result!.score;

      // Second answer should have bonus (streak bonus = (streak - 1) * 100)
      expect(score2).toBeGreaterThan(score1);
    });
  });

  describe("Playlist management", () => {
    it("should have test playlist available", () => {
      const playlist = gameService.getPlaylist("test-playlist");
      expect(playlist).toBeDefined();
      expect(playlist?.name).toBe("테스트 플레이리스트");
    });

    it("should return undefined for non-existent playlist", () => {
      const playlist = gameService.getPlaylist("non-existent");
      expect(playlist).toBeUndefined();
    });
  });

  describe("Game history", () => {
    it("should track completed games", () => {
      gameService.startGame(testRoom);
      gameService.startRound(testRoom, testTracks);
      gameService.endGame(testRoom);

      const history = gameService.getGameHistory();
      expect(history.length).toBeGreaterThan(0);
      expect(history[history.length - 1].roomCode).toBe(testRoom.code);
    });
  });
});
