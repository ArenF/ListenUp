const URL_PATTERNS = [
  /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
  /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
  /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
];

const BARE_VIDEO_ID = /^[a-zA-Z0-9_-]{11}$/;

/**
 * YouTube URL에서 비디오 ID를 추출한다.
 * 11자리 비디오 ID를 그대로 입력한 경우도 허용한다.
 *
 * @returns 추출한 비디오 ID, 형식이 맞지 않으면 null
 */
export function extractVideoId(input: string): string | null {
  for (const pattern of URL_PATTERNS) {
    const match = input.match(pattern);
    if (match?.[1]) return match[1];
  }

  const trimmed = input.trim();
  return BARE_VIDEO_ID.test(trimmed) ? trimmed : null;
}
