/**
 * Fixed set of social platforms a cosplayer credit can link to. Not
 * admin-configurable (unlike ContactMethod) — these are brand names, so a
 * single hardcoded label per language is enough.
 */
export const SOCIAL_PLATFORMS = [
  { value: "rednote", labelEn: "RedNote", labelZh: "小红书" },
  { value: "tiktok", labelEn: "TikTok", labelZh: "TikTok" },
  { value: "instagram", labelEn: "Instagram", labelZh: "Instagram" }
] as const;

export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number]["value"];

export function isSocialPlatform(value: string): value is SocialPlatform {
  return SOCIAL_PLATFORMS.some((p) => p.value === value);
}

export function socialPlatformLabel(locale: string, platform: string): string {
  const p = SOCIAL_PLATFORMS.find((p) => p.value === platform);
  if (!p) return platform;
  return locale === "zh" ? p.labelZh : p.labelEn;
}
