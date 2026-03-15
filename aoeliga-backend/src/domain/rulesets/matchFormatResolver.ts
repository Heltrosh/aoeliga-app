import { httpError } from '../../lib/http';
import type { Ruleset, RulesetMatchFormat, RulesetStage } from './schema';

export type ResolveMatchFormatInput = {
  ruleset: Ruleset;
  stage: RulesetStage;
  roundNumber?: number | null;
  roundLabel?: string | null;
};

export function resolveMatchFormat(input: ResolveMatchFormatInput): { formatId: string; format: RulesetMatchFormat } {
  const { ruleset, stage, roundNumber, roundLabel } = input;

  for (const override of stage.match_format_policy.overrides) {
    if (override.round_number != null && roundNumber != null && override.round_number === roundNumber) {
      const format = ruleset.match_formats[override.format];
      if (!format) httpError(400, `Unknown match format ${override.format}`);
      return { formatId: override.format, format };
    }

    if (override.round && roundLabel && override.round === roundLabel) {
      const format = ruleset.match_formats[override.format];
      if (!format) httpError(400, `Unknown match format ${override.format}`);
      return { formatId: override.format, format };
    }
  }

  const fallback = ruleset.match_formats[stage.match_format_policy.default_format];
  if (!fallback) {
    httpError(400, `Unknown default match format ${stage.match_format_policy.default_format}`);
  }

  return {
    formatId: stage.match_format_policy.default_format,
    format: fallback,
  };
}
