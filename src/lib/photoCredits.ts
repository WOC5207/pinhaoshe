import "server-only";
import { isSocialPlatform } from "./social";

export interface CreditInput {
  cosplayerCn: string;
  characterName: string;
  socialLinks: { platform: string; url: string }[];
}

function isHttpUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Parses and sanitizes the JSON-encoded credits array the admin UI submits —
 * one object per cosplayer, each with an optional list of social links.
 * Nesting rules out the plain parallel-FormData-array approach used before
 * social links existed, so both the upload route and updatePhotoCredits
 * share this instead of re-deriving the same validation twice.
 *
 * Malformed entries are dropped rather than erroring: this is best-effort
 * admin input, not a public API contract. CN is the only required field of
 * a credit; platform/URL are the only required fields of a social link.
 */
export function parseCreditsJson(raw: FormDataEntryValue | null): CreditInput[] {
  if (typeof raw !== "string") return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];

  return parsed
    .map((entry): CreditInput | null => {
      if (typeof entry !== "object" || entry === null) return null;
      const e = entry as Record<string, unknown>;
      const cosplayerCn = String(e.cosplayerCn ?? "").trim().slice(0, 200);
      if (!cosplayerCn) return null;
      const characterName = String(e.characterName ?? "").trim().slice(0, 200);

      const rawLinks = Array.isArray(e.socialLinks) ? e.socialLinks : [];
      const socialLinks = rawLinks
        .map((l): { platform: string; url: string } | null => {
          if (typeof l !== "object" || l === null) return null;
          const link = l as Record<string, unknown>;
          const platform = String(link.platform ?? "").trim();
          const url = String(link.url ?? "").trim().slice(0, 500);
          if (!isSocialPlatform(platform) || !url || !isHttpUrl(url)) return null;
          return { platform, url };
        })
        .filter((l): l is { platform: string; url: string } => l !== null)
        .slice(0, 10);

      return { cosplayerCn, characterName, socialLinks };
    })
    .filter((c): c is CreditInput => c !== null)
    .slice(0, 20);
}
