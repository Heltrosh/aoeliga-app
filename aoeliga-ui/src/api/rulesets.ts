import { api } from "./client";
import {
  createRulesetInputSchema,
  rulesetDeleteResponseSchema,
  rulesetDetailResponseSchema,
  rulesetMutationResponseSchema,
  rulesetsListResponseSchema,
  updateRulesetInputSchema,
  type CreateRulesetInput,
  type RulesetDetail,
  type RulesetListItem,
  type UpdateRulesetInput,
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

export async function createRuleset(input: CreateRulesetInput): Promise<RulesetDetail> {
  const payload = createRulesetInputSchema.parse(input);
  const json = await api.post("/api/rulesets", payload);
  const parsed = rulesetMutationResponseSchema.parse(json);
  return parsed.ruleset;
}

export async function updateRuleset(id: number, input: UpdateRulesetInput): Promise<RulesetDetail> {
  const payload = updateRulesetInputSchema.parse(input);
  const json = await api.put(`/api/rulesets/${id}`, payload);
  const parsed = rulesetMutationResponseSchema.parse(json);
  return parsed.ruleset;
}

export async function deleteRuleset(id: number): Promise<void> {
  const json = await api.delete(`/api/rulesets/${id}`);
  rulesetDeleteResponseSchema.parse(json);
}