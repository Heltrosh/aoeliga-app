import { ZodError } from 'zod';
import { httpError } from '../../lib/http';
import { rulesetSchema, type Ruleset } from './schema';

export function parseRulesetOrThrow(input: unknown): Ruleset {
  try {
    return rulesetSchema.parse(input);
  } catch (error) {
    if (error instanceof ZodError) {
      const issues = error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      }));
      const details = issues.map((issue) => `${issue.path || '<root>'}: ${issue.message}`).join('; ');
      httpError(400, `Invalid ruleset configuration - ${details}`);
    }
    throw error;
  }
}

export function safeParseRuleset(input: unknown) {
  return rulesetSchema.safeParse(input);
}
