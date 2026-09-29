import type { PublicUser } from "../types/index";

/** 프로필 카드에 보여줄 게임 통계 */
export interface PlayerStats {
  level: number;
  /** 대표 스탯: 최고 연속 정답 */
  bestStreak: number;
  gamesPlayed: number;
  /** % */
  winRate: number;
  /** % */
  accuracy: number;
  /** 가장 빨리 맞힌 시간 (초) */
  fastest: number;
  favoriteGenre: string;
  title: string;
}

export interface Tier {
  key: "bronze" | "silver" | "gold" | "master";
  label: string;
  star: string;
}

/** 레벨을 4단계 티어로 환산한다 */
export function tierOf(level: number): Tier {
  if (level >= 40) return { key: "master", label: "MASTER", star: "★★★★" };
  if (level >= 25) return { key: "gold", label: "GOLD", star: "★★★" };
  if (level >= 10) return { key: "silver", label: "SILVER", star: "★★" };
  return { key: "bronze", label: "BRONZE", star: "★" };
}

/** 아바타 URL이 없을 때 대신 보여줄 닉네임(없으면 이메일) 첫 글자 */
export function initialOf(user: PublicUser): string {
  return (user.nickname || user.email).charAt(0).toUpperCase();
}

/** 가입일을 "2026년 1월 15일" 형식으로 바꾼다 */
export function formatJoinDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * 회원 ID를 회원증 번호처럼 바꾼다 (예: LU-1A2B-3C4D-5E)
 *
 * ID 앞부분을 대문자 영숫자 10자로 정리한 뒤 4자리씩 끊는다.
 */
export function formatMemberNo(userId: string): string {
  const memberNo =
    userId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 10).toUpperCase() || "0000000000";
  return "LU-" + (memberNo.match(/.{1,4}/g)?.join("-") ?? memberNo);
}
