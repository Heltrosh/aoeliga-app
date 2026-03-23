import type { Context } from 'hono';

import type { AppBindings } from '../types/app';
import type { MatchUnitContextRow, ParserReplayResponse } from '../domain/replay';
import { findReplayByPlatformMatchId, findReplayBySha1 } from '../repositories/replays';
import { httpError } from '../lib/http';
import { parseParserErrorResponse, toIntBool, validationError } from '../lib/replays';

const encoder = new TextEncoder();

export async function getCloudRunIdToken(c: Context<AppBindings>, audience: string): Promise<string> {
  const serviceAccount = JSON.parse(c.env.GOOGLE_SERVICE_ACCOUNT_JSON) as {
    client_email: string;
    private_key: string;
    token_uri?: string;
  };

  const now = Math.floor(Date.now() / 1000);
  const assertionPayload = {
    iss: serviceAccount.client_email,
    sub: serviceAccount.client_email,
    aud: serviceAccount.token_uri ?? 'https://oauth2.googleapis.com/token',
    target_audience: audience,
    iat: now,
    exp: now + 3600,
  };

  const assertion = await signGoogleJwt(serviceAccount.private_key, assertionPayload, assertionPayload.aud);

  const tokenResponse = await fetch(assertionPayload.aud, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });

  if (!tokenResponse.ok) {
    const text = await tokenResponse.text();
    httpError(500, `Failed to obtain parser identity token: ${text || tokenResponse.status}`);
  }

  const tokenJson = await tokenResponse.json<{ id_token?: string }>();
  if (!tokenJson.id_token) {
    httpError(500, 'Failed to obtain parser identity token');
  }

  return tokenJson.id_token;
}

export async function callReplayParser(
  c: Context<AppBindings>,
  input: { signedDownloadUrl: string; replayId: number },
): Promise<ParserReplayResponse> {
  const parserBaseUrl = c.env.PARSER_URL.replace(/\/$/, '');
  const token = await getCloudRunIdToken(c, parserBaseUrl);

  const response = await fetch(`${parserBaseUrl}/parse`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      signed_download_url: input.signedDownloadUrl,
      replay_id: String(input.replayId),
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    httpError(502, parseParserErrorResponse(response.status, text));
  }

  return response.json<ParserReplayResponse>();
}

export async function runReplayHardValidation(
  c: Context<AppBindings>,
  input: { matchUnit: MatchUnitContextRow; parsed: ParserReplayResponse; currentReplayId: number },
) {
  const { matchUnit, parsed, currentReplayId } = input;

  if (!parsed.ok || !parsed.valid_replay) {
    validationError('The uploaded file is not a valid AoE2 replay');
  }

  const players = parsed.players ?? [];
  if (players.length !== 2) {
    validationError('Replay must contain exactly two players');
  }

  const expectedIds = [matchUnit.player1_aoe_id, matchUnit.player2_aoe_id]
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    .map((value) => value.trim())
    .sort();

  const actualIds = players
    .map((player) => player.profile_id)
    .filter((value): value is number => typeof value === 'number' && Number.isFinite(value))
    .map((value) => String(value))
    .sort();

  if (expectedIds.length !== 2 || actualIds.length !== 2 || expectedIds.join('|') !== actualIds.join('|')) {
    validationError('Replay players do not match the expected match participants');
  }

  if (parsed.completed !== true) {
    validationError('Replay must be a completed game');
  }

  const winnerCount = players.filter((player) => player.winner === true).length;
  if (winnerCount !== 1) {
    validationError('Replay must contain exactly one winner');
  }

  const platformMatchId = parsed.platform?.platform_match_id?.trim();
  if (!platformMatchId) {
    validationError('Replay is missing a platform match id');
  }

  const existingPlatformMatch = await findReplayByPlatformMatchId(c.env.DB, platformMatchId);
  if (existingPlatformMatch && existingPlatformMatch.id !== currentReplayId) {
    validationError('A replay for this platform match already exists');
  }

  if (parsed.platform?.rated !== false) {
    validationError('Replay must come from an unrated lobby');
  }
}

export async function persistAcceptedReplayParse(
  c: Context<AppBindings>,
  input: { replayId: number; matchUnit: MatchUnitContextRow; parsed: ParserReplayResponse },
) {
  const { replayId, matchUnit, parsed } = input;
  const matchedPlayerIdByProfileId = new Map<string, number>();

  if (matchUnit.player1_aoe_id) matchedPlayerIdByProfileId.set(matchUnit.player1_aoe_id, matchUnit.player1_id);
  if (matchUnit.player2_aoe_id) matchedPlayerIdByProfileId.set(matchUnit.player2_aoe_id, matchUnit.player2_id);

  await c.env.DB.prepare(
    `UPDATE replays
     SET parse_status = 'parsed',
         parsed_at = datetime('now'),
         parse_error = NULL,
         validation_status = 'valid',
         validation_completed_at = datetime('now'),
         review_reason = NULL,
         valid_replay = ?,
         completed = ?,
         duration = ?,
         played_at = ?,
         map_name = ?,
         map_dimension = ?,
         diplomacy_type = ?,
         team_size = ?,
         speed = ?,
         cheats = ?,
         hidden_civs = ?,
         map_reveal = ?,
         starting_resources = ?,
         starting_age = ?,
         victory_condition = ?,
         team_together = ?,
         lock_teams = ?,
         lock_speed = ?,
         all_technologies = ?,
         platform_id = ?,
         platform_match_id = ?,
         rated = ?,
         lobby_name = ?,
         allow_specs = ?,
         private = ?,
         spec_delay = ?
     WHERE id = ?`
  ).bind(
    toIntBool(parsed.valid_replay),
    toIntBool(parsed.completed),
    parsed.duration ?? null,
    parsed.played_at ?? null,
    parsed.map?.name ?? null,
    parsed.map?.dimension ?? null,
    parsed.settings?.diplomacy_type ?? null,
    parsed.settings?.team_size ?? null,
    parsed.settings?.speed ?? null,
    toIntBool(parsed.settings?.cheats ?? null),
    toIntBool(parsed.settings?.hidden_civs ?? null),
    parsed.settings?.map_reveal ?? null,
    parsed.settings?.starting_resources ?? null,
    parsed.settings?.starting_age ?? null,
    parsed.settings?.victory_condition ?? null,
    toIntBool(parsed.settings?.team_together ?? null),
    toIntBool(parsed.settings?.lock_teams ?? null),
    toIntBool(parsed.settings?.lock_speed ?? null),
    toIntBool(parsed.settings?.all_technologies ?? null),
    parsed.platform?.platform_id ?? null,
    parsed.platform?.platform_match_id ?? null,
    toIntBool(parsed.platform?.rated ?? null),
    parsed.platform?.lobby_name ?? null,
    toIntBool(parsed.platform?.allow_specs ?? null),
    toIntBool(parsed.platform?.private ?? null),
    parsed.platform?.spec_delay ?? null,
    replayId,
  ).run();

  for (const player of parsed.players ?? []) {
    const profileId = typeof player.profile_id === 'number' ? String(player.profile_id) : null;
    const matchedTournamentPlayerId = profileId ? (matchedPlayerIdByProfileId.get(profileId) ?? null) : null;

    await c.env.DB.prepare(
      `INSERT INTO replay_players (
         replay_id,
         player_number,
         name,
         profile_id,
         civilization_id,
         civilization_name,
         winner,
         matched_tournament_player_id
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      replayId,
      player.number ?? null,
      player.name ?? null,
      profileId,
      player.civilization_id ?? null,
      player.civilization_name ?? null,
      toIntBool(player.winner ?? null),
      matchedTournamentPlayerId,
    ).run();
  }
}

export async function markReplaySkipped(c: Context<AppBindings>, replayId: number) {
  await c.env.DB.prepare(
    `UPDATE replays
     SET parse_status = 'pending',
         validation_status = 'review_required',
         validation_completed_at = datetime('now'),
         review_reason = 'Uploaded without parser validation'
     WHERE id = ?`
  ).bind(replayId).run();
}

export async function runReplayPostAcceptanceTasks(_c: Context<AppBindings>, _input: { replayId: number }) {
  // placeholder for soft checks and later match-result updates
}

export async function generateR2PresignedGetUrl(c: Context<AppBindings>, objectKey: string, expiresInSeconds = 300): Promise<string> {
  const accountId = c.env.R2_ACCOUNT_ID;
  const bucket = c.env.R2_BUCKET_NAME;
  const host = `${accountId}.r2.cloudflarestorage.com`;
  const method = 'GET';
  const now = new Date();
  const amzDate = toAmzDate(now);
  const dateStamp = amzDate.slice(0, 8);
  const region = 'auto';
  const service = 's3';
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const encodedKey = objectKey.split('/').map(encodeURIComponent).join('/');
  const canonicalUri = `/${bucket}/${encodedKey}`;

  const params = new URLSearchParams({
    'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
    'X-Amz-Credential': `${c.env.R2_ACCESS_KEY_ID}/${credentialScope}`,
    'X-Amz-Date': amzDate,
    'X-Amz-Expires': String(expiresInSeconds),
    'X-Amz-SignedHeaders': 'host',
  });

  const canonicalQueryString = params
    .toString()
    .split('&')
    .sort()
    .join('&');

  const canonicalHeaders = `host:${host}\n`;
  const signedHeaders = 'host';
  const payloadHash = 'UNSIGNED-PAYLOAD';

  const canonicalRequest = [
    method,
    canonicalUri,
    canonicalQueryString,
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join('\n');

  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    await sha256Hex(canonicalRequest),
  ].join('\n');

  const signingKey = await getAwsSignatureKey(c.env.R2_SECRET_ACCESS_KEY, dateStamp, region, service);
  const signature = await hmacSha256Hex(signingKey, stringToSign);
  params.set('X-Amz-Signature', signature);

  return `https://${host}${canonicalUri}?${params.toString()}`;
}

export async function deleteReplayObject(c: Context<AppBindings>, replay: { r2_object_key: string }) {
  await c.env.REPLAYS_BUCKET.delete(replay.r2_object_key);
}

async function signGoogleJwt(privateKeyPem: string, payload: Record<string, unknown>, audience: string) {
  const header = { alg: 'RS256', typ: 'JWT' };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify({ ...payload, aud: audience }));
  const toSign = `${encodedHeader}.${encodedPayload}`;
  const key = await importGooglePrivateKey(privateKeyPem);
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, encoder.encode(toSign));
  return `${toSign}.${base64UrlEncodeBytes(signature)}`;
}

async function importGooglePrivateKey(privateKeyPem: string) {
  const clean = privateKeyPem
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s+/g, '');
  const keyBytes = Uint8Array.from(atob(clean), (char) => char.charCodeAt(0));
  return crypto.subtle.importKey(
    'pkcs8',
    keyBytes.buffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );
}

function base64UrlEncode(value: string) {
  return base64UrlEncodeBytes(encoder.encode(value));
}

function base64UrlEncodeBytes(value: ArrayBuffer | Uint8Array) {
  const bytes = value instanceof Uint8Array ? value : new Uint8Array(value);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function toAmzDate(date: Date) {
  return date.toISOString().replace(/[:-]|\.\d{3}/g, '');
}

async function sha256Hex(value: string) {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(value));
  return toHex(new Uint8Array(digest));
}

async function hmacSha256(keyBytes: ArrayBuffer | Uint8Array, value: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    keyBytes instanceof Uint8Array ? keyBytes : new Uint8Array(keyBytes),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  return crypto.subtle.sign('HMAC', key, encoder.encode(value));
}

async function hmacSha256Hex(keyBytes: ArrayBuffer | Uint8Array, value: string) {
  return toHex(new Uint8Array(await hmacSha256(keyBytes, value)));
}

async function getAwsSignatureKey(secret: string, dateStamp: string, region: string, service: string) {
  const kDate = await hmacSha256(encoder.encode(`AWS4${secret}`), dateStamp);
  const kRegion = await hmacSha256(kDate, region);
  const kService = await hmacSha256(kRegion, service);
  return hmacSha256(kService, 'aws4_request');
}

function toHex(bytes: Uint8Array) {
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function rejectAndDeleteReplay(c: Context<AppBindings>, input: { replayId: number; r2ObjectKey: string; message: string }) {
  try {
    await c.env.REPLAYS_BUCKET.delete(input.r2ObjectKey);
  } finally {
    await c.env.DB.prepare(`DELETE FROM replays WHERE id = ?`).bind(input.replayId).run();
  }
  httpError(422, input.message);
}

export async function ensureReplaySha1IsUnique(c: Context<AppBindings>, fileSha1: string) {
  const existing = await findReplayBySha1(c.env.DB, fileSha1);
  if (existing) {
    httpError(409, 'This replay file has already been uploaded');
  }
}

export async function createPendingReplay(c: Context<AppBindings>, input: {
  matchUnitId: number;
  uploadedBy: number;
  r2ObjectKey: string;
  originalFilename: string;
  fileSizeBytes: number;
  fileSha1: string;
}) {
  const result = await c.env.DB.prepare(
    `INSERT INTO replays (
       match_unit_id,
       uploaded_by,
       r2_object_key,
       original_filename,
       file_size_bytes,
       file_sha1,
       parse_status,
       parse_started_at,
       validation_status
     ) VALUES (?, ?, ?, ?, ?, ?, 'parsing', datetime('now'), 'pending')`
  ).bind(
    input.matchUnitId,
    input.uploadedBy,
    input.r2ObjectKey,
    input.originalFilename,
    input.fileSizeBytes,
    input.fileSha1,
  ).run();

  return Number(result.meta.last_row_id);
}