import { fetchTrack } from "../../api/youtube";
import { extractVideoId } from "../../utils/youtubeUrl";
import type { Track } from "../../types";

/**
 * 트랙 추가 폼의 YouTube 검색 상태
 *
 * 입력한 URL에서 비디오 ID를 뽑아 트랙 정보를 조회한다.
 */
export class TrackSearch {
  url = $state("");
  videoId = $state("");
  track = $state<Track | null>(null);
  loading = $state(false);

  /**
   * 입력된 URL 또는 비디오 ID로 트랙을 조회한다.
   * @throws URL 형식이 잘못됐거나 트랙을 찾지 못한 경우
   */
  async search() {
    const videoId = extractVideoId(this.url);
    if (!videoId) {
      throw new Error("유효한 YouTube URL 또는 비디오 ID를 입력해주세요");
    }

    this.videoId = videoId;

    try {
      this.loading = true;
      this.track = await fetchTrack(videoId);
    } catch {
      this.track = null;
      throw new Error("트랙을 찾을 수 없습니다");
    } finally {
      this.loading = false;
    }
  }

  reset() {
    this.url = "";
    this.videoId = "";
    this.track = null;
  }
}
