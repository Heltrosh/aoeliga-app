import type { MiddlewareHandler } from 'hono';

import type { AppBindings } from '../types/app';
import type { MatchUnitContextRow, ReplayContextRow } from '../domain/replay';
import { httpError } from './http';
import { getMatchUnitContext, getReplayContext } from '../repositories/replays';

export const REPLAY_MIN_SIZE_BYTES = 500 * 1024;
export const REPLAY_MAX_SIZE_BYTES = 15 * 1024 * 1024;

export function assertValidPositiveId(
  raw: string | undefined,
  label = 'id',
): number {
  if (raw == null || raw.trim() === '') {
    httpError(400, `${label} is required`);
  }

  const value = Number(raw);

  if (!Number.isInteger(value) || value <= 0) {
    httpError(400, `${label} must be a positive integer`);
  }

  return value;
}

export function assertValidUserId(raw: string | undefined): number {
  return assertValidPositiveId(raw, 'userId');
}

export function isStaffForReplay(c: Parameters<MiddlewareHandler<AppBindings>>[0]): boolean {
  const user = c.get('user');
  if (!user) return false;
  if (user.is_admin === 1) return true;
  const role = c.get('tournamentRole');
  return role === 'admin' || role === 'moderator';
}

export function parseBooleanLike(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value !== 'string') return false;
  const normalized = value.trim().toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on';
}

export function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9._-]+/g, '_');
}

export function buildReplayObjectKey(input: { tournamentSlug: string; matchUnitId: number; filename: string; now?: Date }) {
  const now = input.now ?? new Date();
  const stamp = now.toISOString().replace(/[:.]/g, '-');
  return `replays/${input.tournamentSlug}/match-units/${input.matchUnitId}/${stamp}_${sanitizeFilename(input.filename)}`;
}

export const withMatchUnitById: MiddlewareHandler<AppBindings> = async (c, next) => {
  const tournament = c.get('tournament');
  if (!tournament) httpError(500, 'Tournament context missing');

  const matchUnitId = assertValidPositiveId(c.req.param('matchUnitId'), 'match unit id');
  const matchUnit = await getMatchUnitContext(c.env.DB, { tournamentId: tournament.id, matchUnitId });
  if (!matchUnit) httpError(404, 'Match unit not found');

  c.set('matchUnit', matchUnit as MatchUnitContextRow);
  await next();
};

export const withReplayById: MiddlewareHandler<AppBindings> = async (c, next) => {
  const tournament = c.get('tournament');
  if (!tournament) httpError(500, 'Tournament context missing');

  const replayId = assertValidPositiveId(c.req.param('replayId'), 'replay id');
  const replay = await getReplayContext(c.env.DB, { tournamentId: tournament.id, replayId });
  if (!replay) httpError(404, 'Replay not found');

  c.set('replay', replay as ReplayContextRow);
  await next();
};

export function ensureFile(value: unknown): File {
  if (!(value instanceof File)) {
    httpError(400, 'Replay file is required');
  }
  return value;
}

export function assertReplayFileBasics(file: File) {
  if (!file.name.toLowerCase().endsWith('.aoe2record')) {
    httpError(400, 'Replay file must have the .aoe2record extension');
  }

  if (file.size < REPLAY_MIN_SIZE_BYTES) {
    httpError(400, `Replay file is too small. Minimum size is ${REPLAY_MIN_SIZE_BYTES} bytes`);
  }

  if (file.size > REPLAY_MAX_SIZE_BYTES) {
    httpError(400, `Replay file is too large. Maximum size is ${REPLAY_MAX_SIZE_BYTES} bytes`);
  }
}

export async function sha1Hex(data: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-1', data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function toIntBool(value: boolean | null | undefined): number | null {
  if (value == null) return null;
  return value ? 1 : 0;
}

export function parseParserErrorResponse(status: number, bodyText: string) {
  if (bodyText) {
    try {
      const parsed = JSON.parse(bodyText) as { error?: string; detail?: string };
      if (typeof parsed.detail === 'string' && parsed.detail.trim()) {
        return `Parser request failed (${status}): ${parsed.detail}`;
      }
      if (typeof parsed.error === 'string' && parsed.error.trim()) {
        return `Parser request failed (${status}): ${parsed.error}`;
      }
    } catch {
      // ignore invalid JSON
    }
  }
  return `Parser request failed with status ${status}`;
}

export function validationError(message: string): never {
  httpError(422, message);
}