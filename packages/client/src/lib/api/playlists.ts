import { apiFetch } from "./client";
import type { Playlist } from "../types";

/**
 * 플레이리스트 REST API
 *
 * 트랙을 추가/삭제/수정하는 API는 모두 갱신된 플레이리스트 전체를 돌려준다.
 */

export function fetchPlaylists(): Promise<Playlist[]> {
  return apiFetch<Playlist[]>("/api/playlists");
}

export function createPlaylist(input: {
  name: string;
  description: string;
}): Promise<Playlist> {
  return apiFetch<Playlist>("/api/playlists", {
    method: "POST",
    body: { ...input, tracks: [] },
  });
}

export function updatePlaylist(
  id: string,
  input: { name: string; description: string }
): Promise<Playlist> {
  return apiFetch<Playlist>(`/api/playlists/${id}`, {
    method: "PUT",
    body: input,
  });
}

export function deletePlaylist(id: string): Promise<void> {
  return apiFetch<void>(`/api/playlists/${id}`, { method: "DELETE" });
}

export function addTrack(
  playlistId: string,
  track: { videoId: string; answers: string[] }
): Promise<Playlist> {
  return apiFetch<Playlist>(`/api/playlists/${playlistId}/tracks`, {
    method: "POST",
    body: track,
  });
}

export function removeTrack(
  playlistId: string,
  videoId: string
): Promise<Playlist> {
  return apiFetch<Playlist>(`/api/playlists/${playlistId}/tracks/${videoId}`, {
    method: "DELETE",
  });
}

export function updateTrackAnswers(
  playlistId: string,
  videoId: string,
  answers: string[]
): Promise<Playlist> {
  return apiFetch<Playlist>(`/api/playlists/${playlistId}/tracks/${videoId}`, {
    method: "PUT",
    body: { answers },
  });
}
