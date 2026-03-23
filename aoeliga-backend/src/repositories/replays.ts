import type { Db } from '../types/env';
import type { MatchUnitContextRow, ReplayContextRow, ReplayPlayerRow, ReplayRow } from '../domain/replay';

export async function getMatchUnitContext(db: Db, input: { tournamentId: number; matchUnitId: number }) {
  return db.prepare(
    `SELECT
       mu.id,
       mu.match_id,
       mu.unit_index,
       m.tournament_id,
       m.player1_id,
       m.player2_id,
       tp1.user_id AS player1_user_id,
       tp2.user_id AS player2_user_id,
       tp1.aoe_id AS player1_aoe_id,
       tp2.aoe_id AS player2_aoe_id
     FROM match_units mu
     JOIN matches m ON m.id = mu.match_id
     JOIN tournament_players tp1 ON tp1.id = m.player1_id
     JOIN tournament_players tp2 ON tp2.id = m.player2_id
     WHERE mu.id = ? AND m.tournament_id = ?
     LIMIT 1`
  ).bind(input.matchUnitId, input.tournamentId).first<MatchUnitContextRow>();
}

export async function getReplayContext(db: Db, input: { tournamentId: number; replayId: number }) {
  return db.prepare(
    `SELECT
       r.*,
       mu.match_id,
       mu.unit_index,
       m.tournament_id
     FROM replays r
     JOIN match_units mu ON mu.id = r.match_unit_id
     JOIN matches m ON m.id = mu.match_id
     WHERE r.id = ? AND m.tournament_id = ?
     LIMIT 1`
  ).bind(input.replayId, input.tournamentId).first<ReplayContextRow>();
}

export async function listReplaysForMatchUnit(db: Db, input: { matchUnitId: number }) {
  const rows = await db.prepare(
    `SELECT *
     FROM replays
     WHERE match_unit_id = ?
     ORDER BY uploaded_at DESC, id DESC`
  ).bind(input.matchUnitId).all<ReplayRow>();

  return rows.results ?? [];
}

export async function getReplayPlayers(db: Db, replayId: number) {
  const rows = await db.prepare(
    `SELECT *
     FROM replay_players
     WHERE replay_id = ?
     ORDER BY player_number ASC, id ASC`
  ).bind(replayId).all<ReplayPlayerRow>();

  return rows.results ?? [];
}

export async function findReplayBySha1(db: Db, fileSha1: string) {
  return db.prepare(
    `SELECT id, match_unit_id
     FROM replays
     WHERE file_sha1 = ?
     LIMIT 1`
  ).bind(fileSha1).first<{ id: number; match_unit_id: number }>();
}

export async function findReplayByPlatformMatchId(db: Db, platformMatchId: string) {
  return db.prepare(
    `SELECT id, match_unit_id
     FROM replays
     WHERE platform_match_id = ?
     LIMIT 1`
  ).bind(platformMatchId).first<{ id: number; match_unit_id: number }>();
}
