import * as playlistApi from "../../api/playlists";
import { fetchTracks } from "../../api/youtube";
import { toErrorMessage } from "../../utils/error";
import type { Playlist, Track } from "../../types";

/**
 * 플레이리스트 관리 화면의 도메인 상태
 *
 * 서버 통신은 `lib/api`에 맡기고, 여기서는 그 결과를 상태에 반영하는 일만 한다.
 * 실패하면 `error`에 메시지를 남긴 뒤 그대로 다시 던지므로,
 * 화면은 배너로 보여줄지 alert로 띄울지 스스로 정할 수 있다.
 */
class PlaylistStore {
  playlists = $state<Playlist[]>([]);
  selected = $state<Playlist | null>(null);
  /** 선택된 플레이리스트의 트랙 메타데이터 (YouTube 조회 결과) */
  tracks = $state<Track[]>([]);
  loading = $state(false);
  error = $state("");

  async load() {
    try {
      await this.run(async () => {
        this.playlists = await playlistApi.fetchPlaylists();
      });
    } catch {
      // 첫 목록 로드 실패는 에러 배너로만 알린다
    }
  }

  /** 플레이리스트를 선택하고 트랙 메타데이터를 이어서 불러온다 */
  async select(playlist: Playlist) {
    this.selected = playlist;
    this.tracks = [];
    this.tracks = await fetchTracks(playlist.tracks.map((t) => t.videoId));
  }

  async create(name: string, description: string) {
    const created = await this.run(() =>
      playlistApi.createPlaylist({ name, description })
    );

    this.playlists = [...this.playlists, created];
    this.selected = created;
  }

  async update(name: string, description: string) {
    const target = this.selected;
    if (!target) return;

    const updated = await this.run(() =>
      playlistApi.updatePlaylist(target.id, { name, description })
    );
    this.replace(updated);
  }

  async remove() {
    const target = this.selected;
    if (!target) return;

    await this.run(() => playlistApi.deletePlaylist(target.id));

    this.playlists = this.playlists.filter((p) => p.id !== target.id);
    this.selected = null;
    this.tracks = [];
  }

  async addTrack(track: Track, answers: string[]) {
    const target = this.selected;
    if (!target) return;

    const updated = await this.run(() =>
      playlistApi.addTrack(target.id, { videoId: track.id, answers })
    );

    this.replace(updated);
    this.tracks = [...this.tracks, track];
  }

  async removeTrack(videoId: string) {
    const target = this.selected;
    if (!target) return;

    const updated = await this.run(() =>
      playlistApi.removeTrack(target.id, videoId)
    );

    this.replace(updated);
    this.tracks = this.tracks.filter((t) => t.id !== videoId);
  }

  async updateTrackAnswers(videoId: string, answers: string[]) {
    const target = this.selected;
    if (!target) return;

    const updated = await this.run(() =>
      playlistApi.updateTrackAnswers(target.id, videoId, answers)
    );
    this.replace(updated);
  }

  /** 특정 트랙에 등록된 정답 목록 */
  answersOf(videoId: string): string[] {
    return this.selected?.tracks.find((t) => t.videoId === videoId)?.answers ?? [];
  }

  /** 목록과 선택 상태를 갱신된 플레이리스트로 교체한다 */
  private replace(updated: Playlist) {
    this.playlists = this.playlists.map((p) =>
      p.id === updated.id ? updated : p
    );
    this.selected = updated;
  }

  /** loading/error 상태를 관리하며 서버 작업을 실행한다 */
  private async run<T>(task: () => Promise<T>): Promise<T> {
    try {
      this.loading = true;
      this.error = "";
      return await task();
    } catch (err) {
      this.error = toErrorMessage(err);
      throw err;
    } finally {
      this.loading = false;
    }
  }
}

export const playlistStore = new PlaylistStore();
