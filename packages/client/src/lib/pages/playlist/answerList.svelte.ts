/**
 * 정답 목록 편집 상태
 *
 * 트랙 추가 폼과 정답 수정 폼이 같은 편집 동작을 쓰므로 한곳에 모았다.
 * 입력란이 하나도 없으면 화면이 비어 보이므로 항상 최소 한 칸을 유지한다.
 */
export class AnswerList {
  items = $state<string[]>([""]);

  constructor(initial: string[] = []) {
    this.reset(initial);
  }

  /** 공백만 입력된 칸을 제외한 실제 정답 목록 */
  get filled(): string[] {
    return this.items.filter((answer) => answer.trim() !== "");
  }

  reset(initial: string[] = []) {
    this.items = initial.length > 0 ? [...initial] : [""];
  }

  add() {
    this.items.push("");
  }

  remove(index: number) {
    if (this.items.length === 1) {
      this.items = [""];
      return;
    }

    this.items.splice(index, 1);
  }
}
