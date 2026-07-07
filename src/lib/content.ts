/**
 * Pick the best available text for a locale, falling back to the other
 * language rather than showing nothing.
 */
export function pickText(locale: string, en: string, zh: string): string {
  const ordered = locale === "zh" ? [zh, en] : [en, zh];
  return ordered.find((s) => s && s.trim().length > 0) ?? "";
}

/**
 * Format a photo's credit line (cosplayer + optional character). These are
 * names, not translatable content, so the same string is shown on both the
 * zh and en sites.
 */
export function formatPhotoCredit(
  cosplayerCn: string,
  characterName: string
): string {
  if (!cosplayerCn) return characterName;
  return characterName ? `${cosplayerCn} · ${characterName}` : cosplayerCn;
}
