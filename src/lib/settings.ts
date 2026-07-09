import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/db";
import { pickText } from "@/lib/content";

export const SITE_SETTINGS_ID = "site";

export interface SiteSettings {
  id: string;
  siteTitleEn: string;
  siteTitleZh: string;
  homeTitleEn: string;
  homeTitleZh: string;
  homeSubtitleEn: string;
  homeSubtitleZh: string;
  backgroundColor: string;
  backgroundImage: string;
  logo: string;
}

const DEFAULTS: SiteSettings = {
  id: SITE_SETTINGS_ID,
  siteTitleEn: "",
  siteTitleZh: "",
  homeTitleEn: "",
  homeTitleZh: "",
  homeSubtitleEn: "",
  homeSubtitleZh: "",
  backgroundColor: "",
  backgroundImage: "",
  logo: ""
};

/**
 * The single settings row, cached per-request so the layout and page can both
 * read it without a duplicate query. Returns sensible defaults before the
 * admin has saved anything.
 */
export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  const row = await prisma.siteSettings.findUnique({
    where: { id: SITE_SETTINGS_ID }
  });
  return row ?? DEFAULTS;
});

/**
 * Resolve the site's brand title for a locale, falling back to the other
 * language and finally to the caller-supplied default (the i18n siteName).
 */
export function resolveSiteTitle(
  settings: SiteSettings,
  locale: string,
  fallback: string
): string {
  return pickText(locale, settings.siteTitleEn, settings.siteTitleZh) || fallback;
}

/**
 * Resolve the homepage hero headline for a locale, falling back to the other
 * language and finally to the caller-supplied default (the i18n copy).
 */
export function resolveHomeTitle(
  settings: SiteSettings,
  locale: string,
  fallback: string
): string {
  return pickText(locale, settings.homeTitleEn, settings.homeTitleZh) || fallback;
}

/** Same as resolveHomeTitle, for the hero subtitle. */
export function resolveHomeSubtitle(
  settings: SiteSettings,
  locale: string,
  fallback: string
): string {
  return (
    pickText(locale, settings.homeSubtitleEn, settings.homeSubtitleZh) || fallback
  );
}

/** Admin-configured options for the booking form's contact-method dropdown. */
export const getContactMethods = cache(async () => {
  return prisma.contactMethod.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
  });
});

/** Admin-configured links to the photographer's other sites/profiles. */
export const getPersonalLinks = cache(async () => {
  return prisma.personalLink.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
  });
});

/**
 * Remembered cosplayer social-link profiles (see syncCosplayerProfiles in
 * src/lib/photoCredits.ts), used to prefill the photo-credit editors so the
 * admin doesn't have to retype a cosplayer's links on every new photo.
 */
export const getCosplayerRoster = cache(async () => {
  return prisma.cosplayer.findMany({
    include: { socialLinks: { orderBy: { sortOrder: "asc" } } },
    orderBy: { cosplayerCn: "asc" }
  });
});
