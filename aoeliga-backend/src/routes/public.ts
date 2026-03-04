import { Hono } from "hono";
import type { Env } from "../app";
import { badRequest, notFound, ok } from "../lib/http";
import { parseIntParam } from "../lib/db";
import { optionalUser } from "../lib/auth_session";

const pub = new Hono<{ Bindings: Env }>();

pub.get("/tournaments", async (c) => {
  const res = await c.env.DB.prepare(
    `SELECT id, slug, name, description, status, starts_at, ends_at, created_at
     FROM tournaments
     ORDER BY created_at DESC`
  ).all();

  return ok(c, { tournaments: res?.results ?? [] });
});

pub.get("/tournaments/:slug", async (c) => {
  const slug = c.req.param("slug");

  const t = await c.env.DB.prepare(
    `SELECT id, slug, name, description, status, starts_at, ends_at, created_at
     FROM tournaments
     WHERE slug = ?`
  ).bind(slug).first();

  if (!t) return notFound(c, "Tournament not found");

  const divisions = await c.env.DB.prepare(
    `SELECT id, name, sort_order, ruleset_id
     FROM divisions
     WHERE tournament_id = ?
     ORDER BY sort_order, name`
  ).bind((t as any).id).all();

  return ok(c, { tournament: t, divisions: divisions?.results ?? [] });
});

pub.get("/divisions/:id", async (c) => {
  const divisionId = parseIntParam(c.req.param("id"));
  if (divisionId === null) return badRequest(c, "Invalid division id");

  const division = await c.env.DB.prepare(
    `SELECT d.id, d.name, d.sort_order, d.tournament_id,
            t.slug as tournament_slug, t.name as tournament_name
     FROM divisions d
     JOIN tournaments t ON t.id = d.tournament_id
     WHERE d.id = ?`
  ).bind(divisionId).first();

  if (!division) return notFound(c, "Division not found");

  const players = await c.env.DB.prepare(
    `SELECT tp.id as tp_id,
            tp.user_id,
            tp.nickname,
            u.display_name,
            u.discord_id,
            COALESCE(tp.nickname, u.display_name) AS name
     FROM tournament_players tp
     JOIN users u ON u.id = tp.user_id
     WHERE tp.division_id = ?
     ORDER BY name`
  ).bind(divisionId).all();

  const matches = await c.env.DB.prepare(
    `SELECT m.id, m.stage, m.week_number, m.round_number, m.state, m.scheduled_for,
            m.home_player_id, m.away_player_id,
            COALESCE(hp.nickname, hu.display_name) AS home_name,
            COALESCE(ap.nickname, au.display_name) AS away_name
     FROM matches m
     JOIN tournament_players hp ON hp.id = m.home_player_id
     JOIN tournament_players ap ON ap.id = m.away_player_id
     JOIN users hu ON hu.id = hp.user_id
     JOIN users au ON au.id = ap.user_id
     WHERE m.division_id = ?
     ORDER BY
       CASE m.stage WHEN 'league' THEN 0 ELSE 1 END,
       COALESCE(m.week_number, 999999),
       COALESCE(m.round_number, 999999),
       m.id`
  ).bind(divisionId).all();

  return ok(c, { division, players: players?.results ?? [], matches: matches?.results ?? [] });
});

pub.get("/matches/:id", async (c) => {
  const matchId = parseIntParam(c.req.param("id"));
  if (matchId === null) return badRequest(c, "Invalid match id");

  const match = await c.env.DB.prepare(
    `SELECT m.id, m.tournament_id, m.division_id, m.stage, m.week_number, m.round_number,
            m.state, m.scheduled_for, m.home_player_id, m.away_player_id,
            t.slug as tournament_slug, t.name as tournament_name,
            d.name as division_name,
            COALESCE(hp.nickname, hu.display_name) AS home_name,
            COALESCE(ap.nickname, au.display_name) AS away_name
     FROM matches m
     JOIN tournaments t ON t.id = m.tournament_id
     JOIN divisions d ON d.id = m.division_id
     JOIN tournament_players hp ON hp.id = m.home_player_id
     JOIN tournament_players ap ON ap.id = m.away_player_id
     JOIN users hu ON hu.id = hp.user_id
     JOIN users au ON au.id = ap.user_id
     WHERE m.id = ?`
  ).bind(matchId).first();

  if (!match) return notFound(c, "Match not found");

  const outcome = await c.env.DB.prepare(
    `SELECT match_id, winner_tp_id, loser_tp_id, home_units_won, away_units_won, decided_at
     FROM match_outcomes
     WHERE match_id = ?`
  ).bind(matchId).first();

  const units = await c.env.DB.prepare(
    `SELECT mu.unit_index,
            mu.winner_tp_id, mu.loser_tp_id,
            rf.id as replay_file_id,
            rf.original_filename,
            rf.parse_status
     FROM match_units mu
     JOIN replay_files rf ON rf.id = mu.replay_file_id
     WHERE mu.match_id = ?
     ORDER BY mu.unit_index`
  ).bind(matchId).all();

  return ok(c, { match, outcome: outcome ?? null, units: units?.results ?? [] });
});

// GET /api/me  (null if anonymous)
pub.get("/me", optionalUser, async (c) => {
  const user = c.get("user") ?? null;
  return ok(c, { user });
});

export default pub;