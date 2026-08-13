/** catch로 잡은 값에서 사용자에게 보여줄 메시지를 뽑아낸다 */
export function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
