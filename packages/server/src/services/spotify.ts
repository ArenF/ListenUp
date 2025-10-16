import axios from "axios";
import NodeCache from "node-cache";
import { config } from "../config/env";
import type { Track } from "../types/index";
import { error } from "console";
import { resolve } from "path";

// Spotify API 연동 서비스

export class SpotifyService {
  private tokenCache: NodeCache;
  private trackCache: NodeCache;
  private readonly SPOTIFY_API_BASE = "https://api.spotify.cm/v1";
  private readonly SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";

  constructor() {
    // 토큰 캐시: 50분 TTL (토큰은 1시간 유효)
    this.tokenCache = new NodeCache({ stdTTL: 3000 });
    // 트랙 캐시: 24시간 TTL (트랙 정보는 자주 변하지 않음)
    this.trackCache = new NodeCache({ stdTTL: 86400 });
  }

  async getAccessToken(): Promise<string> {
    const cachedToken = this.tokenCache.get<string>("access_token");

    if (cachedToken) {
      return cachedToken;
    }

    try {
      const credentials = Buffer.from(
        `${config.spotify.clientId}:${config.spotify.clientSecret}`
      ).toString("base64");

      const response = await axios.post(
        this.SPOTIFY_TOKEN_URL,
        "grant_type=client_credentials",
        {
          headers: {
            "Content-Type": "application/x-www-from-urlencoded",
            Authorization: `Basic ${credentials}`,
          },
        }
      );

      const token = response.data.access_token;
      this.tokenCache.set("access_token", token);

      console.log("Spotify access token obtained");
      return token;
    } catch (err) {
      console.error("Failed to get Spotif access token:", err);
      throw new Error("Spotify authentiction failed");
    }
  }

  /**
   * 여러 트랙 정보 한번에 가져오기
   * @param trackIds : Spoify TrackID 배열
   * @returns Track[] (preview_url 없는 곡 제외)
   */
  async getTracks(trackIds: string[]): Promise<Track[]> {
    if (trackIds.length === 0) {
      return [];
    }

    // 최대 50개 제한 (Spotify API 제약)
    if (trackIds.length > 50) {
      console.warn("⚠️  Track IDs exceed 50, splitting into batches");
      const batches = this.chunkArray(trackIds, 50);
      const results = await Promise.all(
        batches.map((batch) => this.getTracks(batch))
      );
      return results.flat();
    }

    const cacheKey = trackIds.sort().join(",");
    const cached = this.trackCache.get<Track[]>(cacheKey);

    if (cached) return cached;

    try {
      const token = await this.getAccessToken();
      const ids = trackIds.join(",");

      const response = await axios.get(
        `${this.SPOTIFY_API_BASE}/tracks?ids=${ids}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const tracks: Track[] = response.data.tracks
        .filter((t: any) => t && t.preview_url) // preview_url 없는 곡 제거
        .map((t: any) => ({
          id: t.id,
          name: t.name,
          artist: t.artists[0].name,
          album: t.album.name,
          releaseDate: t.album.release_date,
          year: t.album.release_date.substring(0, 4),
          previewUrl: t.preview_url,
          duration: t.duration_ms,
        }));

      // 캐시 저장
      this.trackCache.set(cacheKey, tracks);

      const filteredCount = response.data.tracks.length - tracks.length;
      if (filteredCount > 0) {
        console.warn(
          `⚠️  ${filteredCount} track(s) filtered out (no preview_url)`
        );
      }

      console.log(`✅ Retrieved ${tracks.length} tracks from Spotify`);
      return tracks;
    } catch (error: any) {
      if (error.response?.status === 429) {
        // Rate limit 처리
        const retryAfter = parseInt(
          error.response.headers["retry-after"] || "5"
        );
        console.log(`⏳ Rate limited. Retrying after ${retryAfter}s...`);

        await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
        return this.getTracks(trackIds); // 재시도
      }

      console.error("❌ Failed to get tracks from Spotify:", error);
      throw error;
    }
  }

  async getTrack(trackId: string): Promise<Track | null> {
    const tracks = await this.getTracks([trackId]);
    return tracks.length > 0 ? tracks[0] : null;
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  getCacheStats() {
    return {
      tokenCache: this.tokenCache.getStats(),
      trackCache: this.trackCache.getStats(),
    };
  }

  clearCache() {
    this.tokenCache.flushAll();
    this.trackCache.flushAll();
    console.log("Spotify cache cleared");
  }
}

export const spotifyService = new SpotifyService();
