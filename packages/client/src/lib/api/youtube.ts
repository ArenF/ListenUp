import { apiFetch } from "./client";
import type { Track } from "../types";

export function fetchTrack(videoId: string): Promise<Track> {
  return apiFetch<Track>(`/api/youtube/track/${videoId}`);
}

/**
 * 여러 트랙을 병렬로 조회한다.
 *
 * 삭제됐거나 비공개로 바뀐 영상이 섞여 있어도 목록 전체가 실패하지 않도록,
 * 조회에 실패한 트랙은 결과에서 제외한다.
 */
export async function fetchTracks(videoIds: string[]): Promise<Track[]> {
  const results = await Promise.all(
    videoIds.map((videoId) => fetchTrack(videoId).catch(() => null))
  );

  return results.filter((track): track is Track => track !== null);
}
