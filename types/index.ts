import { GroupRole, SessionStatus } from "@prisma/client";

export type { GroupRole, SessionStatus };

export interface LeaderboardRow {
  rank: number;
  userId: string;
  name: string;
  image: string | null;
  gamesPlayed: number;
  profitableNights: number;
  losingNights: number;
  breakEvenNights: number;
  successRate: number;
  totalInvested: number;
  totalCashOut: number;
  totalProfitLoss: number;
  avgProfitPerGame: number;
  roi: number;
  currentStreak: number;
}

export interface PlayerStats {
  userId: string;
  name: string;
  image: string | null;
  gamesPlayed: number;
  profitableNights: number;
  losingNights: number;
  breakEvenNights: number;
  successRate: number;
  totalInvested: number;
  totalCashOut: number;
  totalProfitLoss: number;
  avgProfitPerGame: number;
  roi: number;
  bestNight: number;
  worstNight: number;
  currentStreak: number;
  longestWinStreak: number;
  longestLosingStreak: number;
  sessionHistory: SessionHistoryItem[];
  cumulativeChart: { date: string; cumulative: number }[];
  monthlyChart: { month: string; profitLoss: number }[];
}

export interface SessionHistoryItem {
  sessionId: string;
  date: Date;
  location: string | null;
  buyIn: number;
  rebuy: number;
  cashOut: number;
  totalInvested: number;
  profitLoss: number;
}

export interface SessionValidation {
  isValid: boolean;
  allSubmitted: boolean;
  totalProfitLoss: number;
  missingPlayers: { userId: string; name: string }[];
  errors: string[];
}

export interface SubmissionProgress {
  total: number;
  submitted: number;
  pending: { userId: string; name: string }[];
}

export type Period = "all" | "month" | "quarter" | "year";

export interface Season {
  id: string;
  groupId: string;
  name: string;
  startDate: Date;
  endDate: Date | null;
  isActive: boolean;
  createdAt: Date;
}

export interface AchievementRecord {
  id: string;
  userId: string;
  groupId: string;
  sessionId: string | null;
  type: string;
  label: string;
  value: number | null;
  awardedAt: Date;
}

export interface SettlementRecord {
  id: string;
  sessionId: string;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  amount: number;
  isPaid: boolean;
  paidAt: Date | null;
}

export interface GroupInsights {
  mostImproved: { userId: string; name: string; improvement: number } | null;
  coldest: { userId: string; name: string; streak: number } | null;
  hottest: { userId: string; name: string; streak: number } | null;
  biggestComeback: { userId: string; name: string; amount: number; date: Date } | null;
}
