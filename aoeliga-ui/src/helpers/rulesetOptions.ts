import type { RulesetListItem } from "../api/schemas/rulesets";

export function buildRulesetSelectOptions(rulesets: RulesetListItem[], noneLabel: string) {
  return [
    { value: "none", label: noneLabel },
    ...rulesets.map((ruleset) => ({
      value: String(ruleset.id),
      label: ruleset.name,
    })),
  ];
}