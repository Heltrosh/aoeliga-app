import { httpError } from "./http";

type CompanionLeaderboard = {
  leaderboardId: string;
  rating?: number | null;
  maxRating?: number | null;
  games?: number | null;
};

type CompanionProfileResponse = {
  name?: string | null;
  leaderboards?: CompanionLeaderboard[];
};

type CompanionMatch = {
  started?: string;
};

type CompanionMatchesResponse = {
  page?: number;
  perPage?: number;
  total?: number;
  matches?: CompanionMatch[];
};

export type RegistrationSnapshot = {
  aoeId: string;
  aoeName: string;
  signupRating: number | null;
  signupMaxRating: number | null;
  signupTeamRating: number | null;
  signupTeamMaxRating: number | null;
  currentRating: number | null;
  currentMaxRating: number | null;
  currentTeamRating: number | null;
  currentTeamMaxRating: number | null;
  totalGames: number;
  recentGames: number;
};

const AOE2_COMPANION_URL_RE =
  /^(?:https?:\/\/)?(?:www\.)?aoe2companion\.com\/players\/(\d+)(?:\/)?(?:[?#].*)?$/i;

function normalizeNullableNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.round(value)
    : null;
}

function normalizeGames(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.round(value))
    : 0;
}

function getLeaderboard(
  leaderboards: CompanionLeaderboard[] | undefined,
  leaderboardId: string,
): CompanionLeaderboard | null {
  return leaderboards?.find((entry) => entry.leaderboardId === leaderboardId) ?? null;
}

export function parseAoe2CompanionUrl(input: string): {
  aoeId: string;
  normalizedUrl: string;
} {
  const trimmed = input.trim();
  const match = trimmed.match(AOE2_COMPANION_URL_RE);

  if (!match) {
    httpError(
      400,
      "Invalid AoE2Companion profile URL. Expected aoe2companion.com/players/<id>",
    );
  }

  const aoeId = match[1];

  return {
    aoeId,
    normalizedUrl: `https://www.aoe2companion.com/profile/${aoeId}`,
  };
}

async function fetchJsonOrThrow<T>(url: string): Promise<T> {
  let response: Response;

  try {
    response = await fetch(url, {
      headers: {
        accept: "application/json",
        "user-agent": "AoELiga/1.0", 
      },
    });
  } catch (error) {
    console.error(error);
    httpError(500, "Failed to reach external profile service");
  }

  if (response.status === 404) {
    httpError(400, "AoE2Companion profile was not found");
  }

  if (!response.ok) {
    httpError(500, "Failed to fetch external profile data");
  }

  return (await response.json()) as T;
}

async function countRecentRm1v1Games(
  companionProfileId: string,
  recentGamesDays: number,
): Promise<number> {
  const cutoffMs = Date.now() - recentGamesDays * 24 * 60 * 60 * 1000;

  let count = 0;
  let page = 1;

  while (true) {
    const url = new URL("https://data.aoe2companion.com/api/matches");
    url.searchParams.set("profile_ids", companionProfileId);
    url.searchParams.set("leaderboard_ids", "rm_1v1");
    url.searchParams.set("page", String(page));

    const payload = await fetchJsonOrThrow<CompanionMatchesResponse>(url.toString());
    const matches = payload.matches ?? [];

    if (matches.length === 0) break;

    let hasRecentMatch = false;

    for (const match of matches) {
      if (!match.started) continue;

      const startedMs = Date.parse(match.started);
      if (Number.isNaN(startedMs)) continue;

      if (startedMs >= cutoffMs) {
        count++;
        hasRecentMatch = true;
      }
    }

    if (!hasRecentMatch) break;

    page++;
  }

  return count;
}

export async function fetchRegistrationSnapshot(
  submittedUrl: string,
  recentGamesDays: number,
): Promise<RegistrationSnapshot> {
  if (!Number.isInteger(recentGamesDays) || recentGamesDays <= 0) {
    httpError(400, "recent_games_days must be a positive integer");
  }

  const { aoeId } = parseAoe2CompanionUrl(submittedUrl);

  const companionProfile = await fetchJsonOrThrow<CompanionProfileResponse>(
    `https://data.aoe2companion.com/api/profiles/${aoeId}`,
  );

  const aoeName = companionProfile.name?.trim();
  if (!aoeName) {
    httpError(500, "Failed to parse player name from AoE2Companion");
  }

  const rm1v1 = getLeaderboard(companionProfile.leaderboards, "rm_1v1");
  const rmTeam = getLeaderboard(companionProfile.leaderboards, "rm_team");

  const recentGames = await countRecentRm1v1Games(aoeId, recentGamesDays);

  return {
    aoeId,
    aoeName,
    signupRating: normalizeNullableNumber(rm1v1?.rating),
    signupMaxRating: normalizeNullableNumber(rm1v1?.maxRating),
    signupTeamRating: normalizeNullableNumber(rmTeam?.rating),
    signupTeamMaxRating: normalizeNullableNumber(rmTeam?.maxRating),
    currentRating: normalizeNullableNumber(rm1v1?.rating),
    currentMaxRating: normalizeNullableNumber(rm1v1?.maxRating),
    currentTeamRating: normalizeNullableNumber(rmTeam?.rating),
    currentTeamMaxRating: normalizeNullableNumber(rmTeam?.maxRating),
    totalGames: normalizeGames(rm1v1?.games),
    recentGames,
  };
}