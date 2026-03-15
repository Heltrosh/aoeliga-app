import type { Ruleset, RulesetStage } from '../schema';
import type { EnginePlayer, GeneratedMatchPreview } from '../types';
import { resolveMatchFormat } from '../matchFormatResolver';

const ROUND_LABELS = ['final', 'semifinal', 'quarterfinal', 'round_of_16', 'round_of_32', 'round_of_64', 'round_of_128'] as const;

function nextPowerOfTwo(value: number): number {
  let current = 1;
  while (current < value) current *= 2;
  return current;
}

function getRoundLabel(size: number): string {
  if (size <= 2) return 'final';
  if (size <= 4) return 'semifinal';
  if (size <= 8) return 'quarterfinal';
  const label = `round_of_${size}`;
  return ROUND_LABELS.includes(label as any) ? label : `round_of_${size}`;
}

export function generateSingleEliminationPreview(ruleset: Ruleset, stage: Extract<RulesetStage, { type: 'single_elimination' }>, players: EnginePlayer[]): GeneratedMatchPreview[] {
  if (players.length < 2) return [];
  const ordered = [...players].sort((a, b) => {
    const seedA = a.seed ?? Number.MAX_SAFE_INTEGER;
    const seedB = b.seed ?? Number.MAX_SAFE_INTEGER;
    if (seedA !== seedB) return seedA - seedB;
    return (a.display_name ?? a.discord_name ?? '').localeCompare(b.display_name ?? b.discord_name ?? '');
  });

  const bracketSize = nextPowerOfTwo(ordered.length);
  const seeded: (EnginePlayer | null)[] = [...ordered];
  while (seeded.length < bracketSize) seeded.push(null);

  const out: GeneratedMatchPreview[] = [];
  let currentRoundPlayers: (EnginePlayer | null)[] = seeded;
  let roundNumber = 1;
  while (currentRoundPlayers.length >= 2) {
    const roundLabel = getRoundLabel(currentRoundPlayers.length);
    const { formatId, format } = resolveMatchFormat({ ruleset, stage, roundNumber, roundLabel });

    for (let i = 0; i < currentRoundPlayers.length / 2; i++) {
      const player1 = currentRoundPlayers[i];
      const player2 = currentRoundPlayers[currentRoundPlayers.length - 1 - i];
      out.push({
        stage_id: stage.id,
        stage_type: stage.type,
        round_number: roundNumber,
        round_label: roundLabel,
        week_number: roundNumber,
        player1_id: player1?.id ?? null,
        player2_id: player2?.id ?? null,
        player1_name: player1 ? player1.display_name ?? player1.discord_name : null,
        player2_name: player2 ? player2.display_name ?? player2.discord_name : null,
        bye: !player1 || !player2,
        format_id: formatId,
        format,
      });
    }

    currentRoundPlayers = new Array(currentRoundPlayers.length / 2).fill(null);
    roundNumber += 1;
  }

  return out;
}
