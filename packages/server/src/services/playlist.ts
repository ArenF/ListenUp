import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import type { Playlist, PlaylistTrack } from "../types/index.js";
import { nanoid } from "nanoid";

// ES 모듈에서 __dirname 대체
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 플레이리스트 관리 서비스
 *
 * 주요 기능:
 * - 플레이리스트 CRUD
 * - JSON 파일로 영구 저장
 */
export class PlaylistService {
  private playlists: Map<string, Playlist>;
  private playlistsFilePath: string;

  constructor() {
    this.playlists = new Map();
    this.playlistsFilePath = path.resolve(
      __dirname,
      "../data/playlists.json"
    );
  }

  /**
   * 플레이리스트 초기화 (파일에서 로드)
   */
  async initialize(): Promise<void> {
    try {
      const data = await fs.readFile(this.playlistsFilePath, "utf-8");
      const playlistsData = JSON.parse(data);

      for (const [key, playlist] of Object.entries(playlistsData)) {
        // tracks 구조 검증
        if (playlist && typeof playlist === 'object' && 'tracks' in playlist) {
          const playlistObj = playlist as any;
          if (Array.isArray(playlistObj.tracks)) {
            this.playlists.set(key, playlistObj as Playlist);
          } else {
            console.warn(`⚠️ Invalid playlist format (tracks is not array): ${key}`);
          }
        } else {
          console.warn(`⚠️ Invalid playlist format (missing tracks): ${key}`);
        }
      }

      console.log(
        `✅ Loaded ${this.playlists.size} playlists from ${this.playlistsFilePath}`
      );
    } catch (error) {
      console.error("❌ Failed to load playlists:", error);
      // 파일이 없으면 빈 상태로 시작
      this.playlists = new Map();
    }
  }

  /**
   * 플레이리스트를 파일에 저장
   */
  private async savePlaylists(): Promise<void> {
    try {
      const playlistsObject: Record<string, Playlist> = {};

      for (const [key, playlist] of this.playlists.entries()) {
        playlistsObject[key] = playlist;
      }

      await fs.writeFile(
        this.playlistsFilePath,
        JSON.stringify(playlistsObject, null, 2),
        "utf-8"
      );

      console.log(`💾 Saved ${this.playlists.size} playlists to file`);
    } catch (error) {
      console.error("❌ Failed to save playlists:", error);
      throw error;
    }
  }

  /**
   * 모든 플레이리스트 조회
   */
  getAllPlaylists(): Playlist[] {
    return Array.from(this.playlists.values());
  }

  /**
   * 플레이리스트 조회
   */
  getPlaylist(id: string): Playlist | undefined {
    return this.playlists.get(id);
  }

  /**
   * 플레이리스트 생성
   */
  async createPlaylist(
    name: string,
    description: string,
    tracks: PlaylistTrack[] = [],
    owner?: { id: string; nickname: string }
  ): Promise<{ success: boolean; error?: string; playlist?: Playlist }> {
    // 검증: 이름 중복 체크
    const existingPlaylist = Array.from(this.playlists.values()).find(
      (p) => p.name === name
    );

    if (existingPlaylist) {
      return {
        success: false,
        error: "이미 존재하는 플레이리스트 이름입니다",
      };
    }

    // ID 생성 (slug 형식: 소문자-하이픈)
    const id = `custom-${nanoid(8)}`;

    const playlist: Playlist = {
      id,
      name,
      description,
      tracks,
      roundCount: tracks.length,
      ownerId: owner?.id,
      ownerNickname: owner?.nickname,
    };

    this.playlists.set(id, playlist);

    try {
      await this.savePlaylists();
      console.log(`✅ Created playlist: ${name} (${id})`);
      return { success: true, playlist };
    } catch (error) {
      // 저장 실패 시 롤백
      this.playlists.delete(id);
      return {
        success: false,
        error: "플레이리스트 저장에 실패했습니다",
      };
    }
  }

  /**
   * 플레이리스트 수정
   */
  async updatePlaylist(
    id: string,
    updates: {
      name?: string;
      description?: string;
      tracks?: PlaylistTrack[];
    }
  ): Promise<{ success: boolean; error?: string; playlist?: Playlist }> {
    const playlist = this.playlists.get(id);

    if (!playlist) {
      return { success: false, error: "플레이리스트를 찾을 수 없습니다" };
    }

    // 이름 중복 체크 (자기 자신 제외)
    if (updates.name && updates.name !== playlist.name) {
      const existingPlaylist = Array.from(this.playlists.values()).find(
        (p) => p.name === updates.name && p.id !== id
      );

      if (existingPlaylist) {
        return {
          success: false,
          error: "이미 존재하는 플레이리스트 이름입니다",
        };
      }
    }

    // 업데이트 적용
    const updatedPlaylist: Playlist = {
      ...playlist,
      ...updates,
      roundCount: updates.tracks?.length ?? playlist.roundCount,
    };

    this.playlists.set(id, updatedPlaylist);

    try {
      await this.savePlaylists();
      console.log(`✅ Updated playlist: ${updatedPlaylist.name} (${id})`);
      return { success: true, playlist: updatedPlaylist };
    } catch (error) {
      // 저장 실패 시 롤백
      this.playlists.set(id, playlist);
      return {
        success: false,
        error: "플레이리스트 저장에 실패했습니다",
      };
    }
  }

  /**
   * 플레이리스트 삭제
   */
  async deletePlaylist(
    id: string
  ): Promise<{ success: boolean; error?: string }> {
    const playlist = this.playlists.get(id);

    if (!playlist) {
      return { success: false, error: "플레이리스트를 찾을 수 없습니다" };
    }

    // 백업 (롤백용)
    const backup = playlist;
    this.playlists.delete(id);

    try {
      await this.savePlaylists();
      console.log(`🗑️  Deleted playlist: ${playlist.name} (${id})`);
      return { success: true };
    } catch (error) {
      // 저장 실패 시 롤백
      this.playlists.set(id, backup);
      return {
        success: false,
        error: "플레이리스트 삭제에 실패했습니다",
      };
    }
  }

  /**
   * 플레이리스트에 트랙 추가
   */
  async addTrack(
    playlistId: string,
    videoId: string,
    answers: string[] = []
  ): Promise<{ success: boolean; error?: string; playlist?: Playlist }> {
    const playlist = this.playlists.get(playlistId);

    if (!playlist) {
      return { success: false, error: "플레이리스트를 찾을 수 없습니다" };
    }

    // 중복 체크
    if (playlist.tracks.some(t => t.videoId === videoId)) {
      return {
        success: false,
        error: "이미 플레이리스트에 존재하는 트랙입니다",
      };
    }

    const updatedPlaylist: Playlist = {
      ...playlist,
      tracks: [...playlist.tracks, { videoId, answers }],
      roundCount: playlist.tracks.length + 1,
    };

    return this.updatePlaylist(playlistId, updatedPlaylist);
  }

  /**
   * 플레이리스트에서 트랙 제거
   */
  async removeTrack(
    playlistId: string,
    videoId: string
  ): Promise<{ success: boolean; error?: string; playlist?: Playlist }> {
    const playlist = this.playlists.get(playlistId);

    if (!playlist) {
      return { success: false, error: "플레이리스트를 찾을 수 없습니다" };
    }

    const updatedTracks = playlist.tracks.filter((t) => t.videoId !== videoId);

    if (updatedTracks.length === playlist.tracks.length) {
      return {
        success: false,
        error: "플레이리스트에 해당 트랙이 없습니다",
      };
    }

    return this.updatePlaylist(playlistId, { tracks: updatedTracks });
  }

  /**
   * 플레이리스트 트랙의 정답 수정
   */
  async updateTrack(
    playlistId: string,
    videoId: string,
    answers: string[]
  ): Promise<{ success: boolean; error?: string; playlist?: Playlist }> {
    const playlist = this.playlists.get(playlistId);

    if (!playlist) {
      return { success: false, error: "플레이리스트를 찾을 수 없습니다" };
    }

    const trackIndex = playlist.tracks.findIndex((t) => t.videoId === videoId);

    if (trackIndex === -1) {
      return {
        success: false,
        error: "플레이리스트에 해당 트랙이 없습니다",
      };
    }

    const updatedTracks = [...playlist.tracks];
    updatedTracks[trackIndex] = { videoId, answers };

    return this.updatePlaylist(playlistId, { tracks: updatedTracks });
  }

  /**
   * 플레이리스트 통계
   */
  getStats() {
    return {
      totalPlaylists: this.playlists.size,
      totalTracks: Array.from(this.playlists.values()).reduce(
        (sum, playlist) => sum + playlist.tracks.length,
        0
      ),
    };
  }
}

// 싱글톤 인스턴스 생성
export const playlistService = new PlaylistService();
