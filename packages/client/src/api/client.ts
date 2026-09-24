/**
 * REST API 호출 공통 래퍼
 *
 * JSON 직렬화와 에러 처리를 한곳에 모은다.
 * 인증은 서버가 발급하는 httpOnly 쿠키로 처리하므로,
 * 모든 요청에 credentials를 실어 브라우저가 쿠키를 자동으로 보내게 한다.
 */

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
}

export async function apiFetch<T>(
  path: string,
  { method = "GET", body }: RequestOptions = {}
): Promise<T> {
  const response = await fetch(path, {
    method,
    credentials: "include",
    headers:
      body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  // 204 No Content처럼 본문이 없는 응답도 있으므로 먼저 텍스트로 받는다
  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

/** 실패 응답에서 사용자에게 보여줄 메시지를 뽑아낸다 */
async function readErrorMessage(response: Response): Promise<string> {
  try {
    const data = await response.json();
    if (data?.error) return data.error;
  } catch {
    // JSON 본문이 아니면 상태 코드로 대체한다
  }

  return `요청에 실패했습니다 (${response.status})`;
}
