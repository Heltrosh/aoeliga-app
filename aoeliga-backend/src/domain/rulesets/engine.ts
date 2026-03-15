import { httpError } from '../../lib/http';
import { generateRoundRobinPreview } from './generators/roundRobin';
import { generateSingleEliminationPreview } from './generators/singleElimination';
import { resolveMatchFormat } from './matchFormatResolver';
import type { Ruleset } from './schema';
import type { EnginePlayer } from './types';

export function getStageById(ruleset: Ruleset, stageId: string) {
  const stage = ruleset.stages.find((entry) => entry.id === stageId);
  if (!stage) httpError(404, `Ruleset stage ${stageId} not found`);
  return stage;
}

export function generateStagePreview(ruleset: Ruleset, stageId: string, players: EnginePlayer[]) {
  const stage = getStageById(ruleset, stageId);

  switch (stage.type) {
    case 'round_robin':
      return generateRoundRobinPreview(ruleset, stage, players);
    case 'single_elimination':
      return generateSingleEliminationPreview(ruleset, stage, players);
    case 'double_elimination':
      httpError(501, 'double_elimination preview generation is not implemented yet');
  }
}

export function previewMatchFormat(ruleset: Ruleset, stageId: string, roundNumber?: number | null, roundLabel?: string | null) {
  const stage = getStageById(ruleset, stageId);
  return resolveMatchFormat({ ruleset, stage, roundNumber, roundLabel });
}
