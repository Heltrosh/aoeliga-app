import { api } from "./client";
import {
  rulesetsListResponseSchema,
  rulesetDetailResponseSchema,
  type RulesetDetail,
  type RulesetListItem,
} from "./schemas/rulesets";

export async function fetchRulesets(): Promise<RulesetListItem[]> {
  const json = await api.get("/api/rulesets");
  const parsed = rulesetsListResponseSchema.parse(json);
  return parsed.rulesets;
}

export async function fetchRulesetById(id: number): Promise<RulesetDetail> {
  const json = await api.get(`/api/rulesets/${id}`);

  const parsed = rulesetDetailResponseSchema.parse(json);
  return parsed.ruleset;
}