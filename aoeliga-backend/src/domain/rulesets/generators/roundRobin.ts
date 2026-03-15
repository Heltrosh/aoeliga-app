import type { Ruleset, RulesetStage } from '../schema';
import type { EnginePlayer, GeneratedMatchPreview } from '../types';
import { resolveMatchFormat } from '../matchFormatResolver';

function normalizePlayers(players: EnginePlayer[]) {
  return [...players].sort((a, b) => {
    const seedA = a.seed ?? Number.MAX_SAFE_INTEGER;
    const seedB = b.seed ?? Number.MAX_SAFE_INTEGER;
    if (seedA !== seedB) return seedA - seedB;
    return (a.display_name ?? a.discord_name ?? '').localeCompare(b.display_name ?? b.discord_name ?? '');
  });
}

export function generateRoundRobinPreview(ruleset: Ruleset, stage: Extract<RulesetStage, { type: 'round_robin' }>, players: EnginePlayer[]): GeneratedMatchPreview[] {
  const ordered = normalizePlayers(players);
  if (ordered.length < 2) return [];

  const participantList: (EnginePlayer | null)[] = [...ordered];
  const hasBye = participantList.length % 2 === 1;
  if (hasBye) participantList.push(null);

  const roundsPerLeg = participantList.length - 1;
  const half = participantList.length / 2;
  const out: GeneratedMatchPreview[] = [];

  for (let leg = 0; leg < stage.round_robin.legs; leg++) {
    const rotating = [...participantList];

    for (let roundIndex = 0; roundIndex < roundsPerLeg; roundIndex++) {
      const roundNumber = leg * roundsPerLeg + roundIndex + 1;
      const weekNumber = roundNumber;
      const { formatId, format } = resolveMatchFormat({ ruleset, stage, roundNumber });

      for (let i = 0; i < half; i++) {
        const left = rotating[i];
        const right = rotating[rotating.length - 1 - i];
        let player1 = left;
        let player2 = right;

        if (i === 0 && roundIndex % 2 === 1) {
          player1 = right;
          player2 = left;
        }

        if (leg % 2 === 1) {
          [player1, player2] = [player2, player1];
        }

        out.push({
          stage_id: stage.id,
          stage_type: stage.type,
          round_number: roundNumber,
          round_label: null,
          week_number: stage.cadence?.round_duration_days ? weekNumber : null,
          player1_id: player1?.id ?? null,
          player2_id: player2?.id ?? null,
          player1_name: player1 ? player1.display_name ?? player1.discord_name : null,
          player2_name: player2 ? player2.display_name ?? player2.discord_name : null,
          bye: !player1 || !player2,
          format_id: formatId,
          format,
        });
      }

      const fixed = rotating[0];
      const rest = rotating.slice(1);
      rest.unshift(rest.pop()!);
      rotating.splice(0, rotating.length, fixed, ...rest);
    }
  }

  return out;
}
