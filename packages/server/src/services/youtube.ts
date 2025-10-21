import axios from "axios";
import NodeCache from "node-cache";
import { config } from "../config/env";
import type { Track, YouTubeApiResponse } from "../types/index";

// YouTube Data API v3 연동 서비스

export class YouTubeService {
  private videoCache: NodeCache;
  private readonly YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";

  constructor() {
    // 비디오 캐시: 24시간 TTL (비디오 정보는 자주 변하지 않음)
    this.videoCache = new NodeCache({ stdTTL: 86400 });
  }

  /**
   * ISO 8601 duration을 초 단위로 변환
   * 예: PT3M45S → 225초
   */
  private parseDuration(isoDuration: string): number {
    const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;

    const hours = parseInt(match[1] || "0");
    const minutes = parseInt(match[2] || "0");
    const seconds = parseInt(match[3] || "0");

    return hours * 3600 + minutes * 60 + seconds;
  }

  /**
   * 여러 비디오 정보 한번에 가져오기
   * @param videoIds : YouTube Video ID 배열
   * @returns Track[]
   */
  async getTracks(videoIds: string[]): Promise<Track[]> {
    if (videoIds.length === 0) {
      return [];
    }

    if (!config.youtube.apiKey) {
      console.error("❌ YOUTUBE_API_KEY is not configured");
      return [];
    }

    // 최대 50개 제한 (YouTube API 제약)
    if (videoIds.length > 50) {
      console.warn("⚠️  Video IDs exceed 50, splitting into batches");
      const batches = this.chunkArray(videoIds, 50);
      const results = await Promise.all(
        batches.map((batch) => this.getTracks(batch))
      );
      return results.flat();
    }

    const cacheKey = videoIds.sort().join(",");
    const cached = this.videoCache.get<Track[]>(cacheKey);

    if (cached) {
      console.log(`✅ Retrieved ${cached.length} tracks from cache`);
      return cached;
    }

    try {
      const ids = videoIds.join(",");
      const response = await axios.get<YouTubeApiResponse>(
        `${this.YOUTUBE_API_BASE}/videos`,
        {
          params: {
            part: "snippet,contentDetails",
            id: ids,
            key: config.youtube.apiKey,
          },
        }
      );

      const tracks: Track[] = response.data.items
        .filter((item) => item.snippet && item.contentDetails)
        .map((item) => {
          const duration = this.parseDuration(item.contentDetails.duration);

          // 30초 미리듣기 구간 계산 (전체 곡의 중간 30초)
          const totalDuration = duration;
          const previewDuration = 30;
          const startSeconds = Math.max(
            0,
            Math.floor((totalDuration - previewDuration) / 2)
          );
          const endSeconds = Math.min(
            totalDuration,
            startSeconds + previewDuration
          );

          // 발매년도 추출 (YYYY-MM-DD 형식에서 YYYY만)
          const publishedAt = item.snippet.publishedAt;
          const year = publishedAt.substring(0, 4);

          return {
            id: item.id,
            name: item.snippet.title,
            artist: item.snippet.channelTitle,
            uploadDate: publishedAt,
            year,
            embedUrl: `https://www.youtube.com/embed/${item.id}`,
            duration: totalDuration,
            startSeconds,
            endSeconds,
            thumbnailUrl: item.snippet.thumbnails.high.url,
          };
        });

      // 캐시 저장
      this.videoCache.set(cacheKey, tracks);

      const filteredCount = videoIds.length - tracks.length;
      if (filteredCount > 0) {
        console.warn(
          `⚠️  ${filteredCount} video(s) not found or unavailable`
        );
      }

      console.log(`✅ Retrieved ${tracks.length} tracks from YouTube`);
      return tracks;
    } catch (error: any) {
      if (error.response?.status === 403) {
        // API 키 문제 또는 할당량 초과
        console.error("❌ YouTube API error (403):");
        console.error("   - Check if YOUTUBE_API_KEY is valid");
        console.error("   - Check if YouTube Data API v3 is enabled");
        console.error("   - Check if quota limit is exceeded");
        throw new Error("YouTube API authentication or quota error");
      }

      if (error.response?.status === 429) {
        // Rate limit 처리
        console.error("❌ YouTube API rate limit exceeded");
        throw new Error("YouTube API rate limit exceeded");
      }

      console.error("❌ Failed to get videos from YouTube:", error.message);
      throw error;
    }
  }

  /**
   * 단일 비디오 정보 가져오기
   * @param videoId : YouTube Video ID
   * @returns Track | null
   */
  async getTrack(videoId: string): Promise<Track | null> {
    const tracks = await this.getTracks([videoId]);
    return tracks.length > 0 ? tracks[0] : null;
  }

  /**
   * 배열을 지정된 크기로 분할
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * 캐시 통계 반환
   */
  getCacheStats() {
    return {
      videoCache: this.videoCache.getStats(),
    };
  }

  /**
   * 캐시 초기화
   */
  clearCache() {
    this.videoCache.flushAll();
    console.log("✅ YouTube cache cleared");
  }
}

export const youtubeService = new YouTubeService();
