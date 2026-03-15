import { httpError } from '../../../lib/http';
import type { RulesetScoringSystem } from '../schema';
import type { EngineMatch, EnginePlayer, StandingsRow } from '../types';

function getPlayerName(player: EnginePlayer) {
  return player.display_name ?? player.discord_name ?? `Player ${player.id}`;
}

function isCompletedMatch(match: EngineMatch) {
  return match.player1_points != null && match.player2_points != null;
}

export function calculateStandings(
  players: EnginePlayer[],
  matches: EngineMatch[],
  scoringSystem: RulesetScoringSystem,
  tiebreakers: readonly string[]
): StandingsRow[] {
  const baseRows = new Map<number, StandingsRow>();

  for (const player of players) {
    baseRows.set(player.id, {
      player_id: player.id,
      display_name: getPlayerName(player),
      seed: player.seed ?? null,
      matches_played: 0,
      match_wins: 0,
      match_losses: 0,
      game_wins: 0,
      game_losses: 0,
      game_difference: 0,
      match_points: 0,
      rank: 0,
    });
  }

  for (const match of matches) {
    if (!isCompletedMatch(match)) continue;
    const left = baseRows.get(match.player1_id);
    const right = baseRows.get(match.player2_id);
    if (!left || !right) continue;

    left.matches_played += 1;
    right.matches_played += 1;
    left.game_wins += match.player1_points ?? 0;
    left.game_losses += match.player2_points ?? 0;
    right.game_wins += match.player2_points ?? 0;
    right.game_losses += match.player1_points ?? 0;

    const leftWon = (match.player1_points ?? 0) > (match.player2_points ?? 0);
    const rightWon = (match.player2_points ?? 0) > (match.player1_points ?? 0);

    if (leftWon) {
      left.match_wins += 1;
      right.match_losses += 1;
    } else if (rightWon) {
      right.match_wins += 1;
      left.match_losses += 1;
    }

    if (scoringSystem.type === 'match_points') {
      if (leftWon) {
        left.match_points += scoringSystem.win;
        right.match_points += scoringSystem.loss;
      } else if (rightWon) {
        right.match_points += scoringSystem.win;
        left.match_points += scoringSystem.loss;
      } else {
        left.match_points += scoringSystem.draw;
        right.match_points += scoringSystem.draw;
      }
    } else if (scoringSystem.type === 'game_points') {
      left.match_points += (match.player1_points ?? 0) * scoringSystem.per_game_win + (match.player2_points ?? 0) * scoringSystem.per_game_loss;
      right.match_points += (match.player2_points ?? 0) * scoringSystem.per_game_win + (match.player1_points ?? 0) * scoringSystem.per_game_loss;
    } else if (scoringSystem.type === 'hybrid') {
      left.match_points += (match.player1_points ?? 0) * scoringSystem.game_win + (match.player2_points ?? 0) * scoringSystem.game_loss;
      right.match_points += (match.player2_points ?? 0) * scoringSystem.game_win + (match.player1_points ?? 0) * scoringSystem.game_loss;
      if (leftWon) {
        left.match_points += scoringSystem.match_win;
        right.match_points += scoringSystem.match_loss;
      } else if (rightWon) {
        right.match_points += scoringSystem.match_win;
        left.match_points += scoringSystem.match_loss;
      } else {
        left.match_points += scoringSystem.draw;
        right.match_points += scoringSystem.draw;
      }
    } else {
      httpError(400, 'Unsupported scoring system');
    }
  }

  const rows = [...baseRows.values()].map((row) => ({
    ...row,
    game_difference: row.game_wins - row.game_losses,
  }));

  rows.sort((a, b) => compareRows(a, b, tiebreakers));
  rows.forEach((row, index) => {
    row.rank = index + 1;
  });

  return rows;
}

function compareRows(a: StandingsRow, b: StandingsRow, tiebreakers: readonly string[]) {
  const effective = tiebreakers.length > 0 ? tiebreakers : ['match_points', 'game_difference', 'games_won', 'seed'];

  for (const tiebreaker of effective) {
    const diff = compareByTiebreaker(a, b, tiebreaker);
    if (diff !== 0) return diff;
  }

  return a.display_name.localeCompare(b.display_name);
}

function compareByTiebreaker(a: StandingsRow, b: StandingsRow, tiebreaker: string) {
  switch (tiebreaker) {
    case 'match_points':
      return b.match_points - a.match_points;
    case 'game_difference':
      return b.game_difference - a.game_difference;
    case 'games_won':
      return b.game_wins - a.game_wins;
    case 'seed':
      return (a.seed ?? Number.MAX_SAFE_INTEGER) - (b.seed ?? Number.MAX_SAFE_INTEGER);
    case 'head_to_head':
      return 0;
    default:
      return 0;
  }
}
