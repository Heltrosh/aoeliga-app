import { z } from "zod";

export const tournamentStatusSchema = z.enum([
  "draft",
  "signup",
  "active",
  "completed",
  "archived",
]);

export type TournamentStatus = z.infer<typeof tournamentStatusSchema>;

export const tournamentRegistrationStatusSchema = z.enum([
  "pending",
  "approved",
  "rejected",
  "withdrawn",
]);

export type TournamentRegistrationStatus =
  z.infer<typeof tournamentRegistrationStatusSchema>;

export const tournamentPlayerStatusSchema = z.enum([
  "active",
  "withdrawn",
  "banned",
]);

export type TournamentPlayerStatus =
  z.infer<typeof tournamentPlayerStatusSchema>;

export const matchStageSchema = z.enum([
  "group",
  "playoffs",
  "custom",
]);

export type MatchStage = z.infer<typeof matchStageSchema>;

export const matchStatusSchema = z.enum([
  "created",
  "scheduled",
  "awaiting_report",
  "played",
  "forfeited",
]);

export type MatchStatus = z.infer<typeof matchStatusSchema>;

export const replayParseStatusSchema = z.enum([
  "pending",
  "parsing",
  "parsed",
  "failed",
]);

export type ReplayParseStatus = z.infer<typeof replayParseStatusSchema>;