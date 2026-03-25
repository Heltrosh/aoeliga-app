import type { Db } from '../types/env';
import type {
  TournamentSetupDivisionRow,
  TournamentSetupEligibleRegistrationRow,
  TournamentSetupMatchViewRow,
  TournamentSetupPlayerAssignmentViewRow,
  TournamentSetupSessionRow,
} from '../domain/tournamentSetup';

export async function getSetupSessionByTournamentId(db: Db, tournamentId: number) {
  return db.prepare(
    `SELECT *
     FROM tournament_setup_sessions
     WHERE tournament_id = ?
     LIMIT 1`,
  ).bind(tournamentId).first<TournamentSetupSessionRow>();
}

export async function createSetupSession(db: Db, input: { tournamentId: number; createdBy: number }) {
  const result = await db.prepare(
    `INSERT INTO tournament_setup_sessions (
       tournament_id,
       status,
       created_by
     ) VALUES (?, 'draft', ?)`,
  ).bind(input.tournamentId, input.createdBy).run();

  return Number(result.meta.last_row_id);
}

export async function listSetupDivisions(db: Db, setupSessionId: number) {
  const rows = await db.prepare(
    `SELECT *
     FROM tournament_setup_divisions
     WHERE setup_session_id = ?
     ORDER BY sort_order ASC, id ASC`,
  ).bind(setupSessionId).all<TournamentSetupDivisionRow>();

  return rows.results ?? [];
}

export async function listApprovedRegistrationsForSetup(db: Db, tournamentId: number) {
  const rows = await db.prepare(
    `SELECT tr.id AS registration_id,
            tr.user_id,
            tr.aoe_id,
            tr.aoe_name,
            u.display_name,
            u.discord_name,
            u.avatar,
            ps.signup_rating,
            ps.signup_max_rating,
            ps.signup_team_rating,
            ps.signup_max_team_rating,
            ps.current_rating,
            ps.current_max_rating,
            ps.current_team_rating,
            ps.current_max_team_rating,
            ps.total_games,
            ps.recent_games,
            ps.current_data_fetched_at
     FROM tournament_registrations tr
     JOIN users u ON u.id = tr.user_id
     LEFT JOIN player_statistics ps ON ps.registration_id = tr.id
     WHERE tr.tournament_id = ?
       AND tr.status = 'approved'
     ORDER BY COALESCE(u.display_name, u.discord_name, tr.aoe_name) ASC, tr.id ASC`,
  ).bind(tournamentId).all<TournamentSetupEligibleRegistrationRow>();

  return rows.results ?? [];
}

export async function listSetupAssignments(db: Db, setupSessionId: number) {
  const rows = await db.prepare(
    `SELECT a.*,
            d.name AS division_name,
            d.sort_order AS division_sort_order,
            tr.user_id,
            tr.aoe_id,
            tr.aoe_name,
            u.display_name,
            u.discord_name,
            u.avatar,
            ps.signup_rating,
            ps.signup_max_rating,
            ps.signup_team_rating,
            ps.signup_max_team_rating,
            ps.current_rating,
            ps.current_max_rating,
            ps.current_team_rating,
            ps.current_max_team_rating,
            ps.total_games,
            ps.recent_games,
            ps.current_data_fetched_at
     FROM tournament_setup_player_assignments a
     JOIN tournament_setup_divisions d ON d.id = a.setup_division_id
     JOIN tournament_registrations tr ON tr.id = a.registration_id
     JOIN users u ON u.id = tr.user_id
     LEFT JOIN player_statistics ps ON ps.registration_id = tr.id
     WHERE a.setup_session_id = ?
     ORDER BY d.sort_order ASC, a.sort_order ASC, a.seed ASC, a.id ASC`,
  ).bind(setupSessionId).all<TournamentSetupPlayerAssignmentViewRow>();

  return rows.results ?? [];
}

export async function listSetupMatches(db: Db, setupSessionId: number) {
  const rows = await db.prepare(
    `SELECT m.*,
            d.name AS division_name,
            d.sort_order AS division_sort_order,
            COALESCE(u1.display_name, u1.discord_name, tr1.aoe_name) AS player1_name,
            COALESCE(u2.display_name, u2.discord_name, tr2.aoe_name) AS player2_name
     FROM tournament_setup_matches m
     JOIN tournament_setup_divisions d ON d.id = m.setup_division_id
     LEFT JOIN tournament_registrations tr1 ON tr1.id = m.player1_registration_id
     LEFT JOIN users u1 ON u1.id = tr1.user_id
     LEFT JOIN tournament_registrations tr2 ON tr2.id = m.player2_registration_id
     LEFT JOIN users u2 ON u2.id = tr2.user_id
     WHERE m.setup_session_id = ?
     ORDER BY d.sort_order ASC, m.round_number ASC, m.week_number ASC, m.id ASC`,
  ).bind(setupSessionId).all<TournamentSetupMatchViewRow>();

  return rows.results ?? [];
}

export async function countLiveTournamentState(db: Db, tournamentId: number) {
  const [divisions, players, matches] = await Promise.all([
    db.prepare(`SELECT COUNT(*) AS count FROM divisions WHERE tournament_id = ?`).bind(tournamentId).first<{ count: number }>(),
    db.prepare(`SELECT COUNT(*) AS count FROM tournament_players WHERE tournament_id = ?`).bind(tournamentId).first<{ count: number }>(),
    db.prepare(`SELECT COUNT(*) AS count FROM matches WHERE tournament_id = ?`).bind(tournamentId).first<{ count: number }>(),
  ]);

  return {
    divisionCount: Number(divisions?.count ?? 0),
    playerCount: Number(players?.count ?? 0),
    matchCount: Number(matches?.count ?? 0),
  };
}
