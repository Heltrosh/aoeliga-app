import { httpError } from "./http";

type CompanionLeaderboard = {
  leaderboardId: string;
  rating?: number | null;
  maxRating?: number | null;
  games?: number | null;
};

type CompanionProfileResponse = {
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

const AOE2_INSIGHTS_URL_RE =
  /^(?:https?:\/\/)?(?:www\.)?aoe2insights\.com\/user\/(\d+)(?:\/)?(?:[?#].*)?$/i;

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

function decodeHtml(value: string): string {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .trim();
}

function getLeaderboard(
  leaderboards: CompanionLeaderboard[] | undefined,
  leaderboardId: string,
): CompanionLeaderboard | null {
  return leaderboards?.find((entry) => entry.leaderboardId === leaderboardId) ?? null;
}

export function parseAoe2InsightsUrl(input: string): {
  aoeId: string;
  normalizedUrl: string;
} {
  const trimmed = input.trim();
  const match = trimmed.match(AOE2_INSIGHTS_URL_RE);

  if (!match) {
    httpError(
      400,
      "Invalid AoE2Insights profile URL. Expected aoe2insights.com/user/<id>",
    );
  }

  const aoeId = match[1];

  return {
    aoeId,
    normalizedUrl: `https://www.aoe2insights.com/user/${aoeId}/`,
  };
}

async function fetchTextOrThrow(url: string): Promise<string> {
  let response: Response;

  try {
    response = await fetch(url, {
      headers: {
        "accept": "text/html,application/json;q=0.9,*/*;q=0.8",
      },
    });
  } catch (error) {
    console.error(error);
    httpError(500, "Failed to reach external profile service");
  }

  if (response.status === 404) {
    httpError(400, "AoE2Insights profile was not found");
  }

  if (!response.ok) {
    httpError(500, "Failed to fetch external profile data");
  }

  return await response.text();
}

async function fetchJsonOrThrow<T>(url: string): Promise<T> {
  let response: Response;

  try {
    response = await fetch(url, {
      headers: {
        accept: "application/json",
      },
    });
  } catch (error) {
    console.error(error);
    httpError(500, "Failed to reach external profile service");
  }

  if (!response.ok) {
    httpError(500, "Failed to fetch external profile data");
  }

  return (await response.json()) as T;
}

function extractInsightsName(html: string): string {
  const match = html.match(
    /<h1 class="name">\s*<a[^>]*>([^<]+)<\/a>\s*<\/h1>/i,
  );

  if (!match?.[1]) {
    httpError(500, "Failed to parse player name from AoE2Insights");
  }

  return decodeHtml(match[1]);
}

function extractRelicProfileId(html: string): string {
  const match = html.match(/\/user\/relic\/(\d+)\/?/i);

  if (!match?.[1]) {
    httpError(500, "Failed to parse Relic profile id from AoE2Insights");
  }

  return match[1];
}

async function countRecentRm1v1Games(
  relicProfileId: string,
  recentGamesDays: number,
): Promise<number> {
  const cutoffMs = Date.now() - recentGamesDays * 24 * 60 * 60 * 1000;
  let count = 0;
  let page = 1;

  while (true) {
    const url = new URL("https://data.aoe2companion.com/api/matches");
    url.searchParams.set("profile_ids", relicProfileId);
    url.searchParams.set("leaderboard_ids", "rm_1v1");
    url.searchParams.set("page", String(page));

    const payload = await fetchJsonOrThrow<CompanionMatchesResponse>(url.toString());
    const matches = payload.matches ?? [];

    if (matches.length === 0) {
      break;
    }

    let reachedOlderMatches = false;

    for (const match of matches) {
      if (!match.started) {
        continue;
      }

      const startedMs = Date.parse(match.started);
      if (Number.isNaN(startedMs)) {
        continue;
      }

      if (startedMs >= cutoffMs) {
        count += 1;
      } else {
        reachedOlderMatches = true;
      }
    }

    if (reachedOlderMatches) {
      break;
    }

    const perPage = payload.perPage ?? matches.length;
    const total = payload.total ?? matches.length;

    if (page * perPage >= total) {
      break;
    }

    page += 1;
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

  const { aoeId, normalizedUrl } = parseAoe2InsightsUrl(submittedUrl);

  const insightsHtml = await fetchTextOrThrow(normalizedUrl);
  const aoeName = extractInsightsName(insightsHtml);
  const relicProfileId = extractRelicProfileId(insightsHtml);

  const companionProfile = await fetchJsonOrThrow<CompanionProfileResponse>(
    `https://data.aoe2companion.com/api/profiles/${relicProfileId}`,
  );

  const rm1v1 = getLeaderboard(companionProfile.leaderboards, "rm_1v1");
  const rmTeam = getLeaderboard(companionProfile.leaderboards, "rm_team");

  const recentGames = await countRecentRm1v1Games(relicProfileId, recentGamesDays);

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