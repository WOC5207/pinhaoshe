import "server-only";
import { prisma } from "./db";

export interface SiteStats {
  photoCount: number;
  albumCount: number;
  cosplayerCount: number;
}

/**
 * Simple, always-fresh homepage stats computed from published content —
 * cosplayerCount is a distinct count of PhotoCredit.cosplayerCn, so it's an
 * approximation (the same person spelled/cased differently across credits
 * counts twice), which is fine for a fun quick-stats card, not a strict metric.
 */
export async function getSiteStats(): Promise<SiteStats> {
  const [photoCount, albumCount, credits] = await Promise.all([
    prisma.photo.count({ where: { event: { published: true } } }),
    prisma.event.count({ where: { published: true } }),
    prisma.photoCredit.findMany({
      where: {
        photo: { event: { published: true } },
        cosplayerCn: { not: "" }
      },
      select: { cosplayerCn: true },
      distinct: ["cosplayerCn"]
    })
  ]);
  return { photoCount, albumCount, cosplayerCount: credits.length };
}
