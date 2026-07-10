import { prisma } from "@/lib/db";

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

/** Appends -2, -3, ... until the slug is free among published/draft Events. */
export async function uniqueEventSlug(
  base: string,
  excludeId?: string
): Promise<string> {
  const root = base || `event-${Date.now().toString(36)}`;
  let candidate = root;
  for (let i = 2; ; i++) {
    const existing = await prisma.event.findUnique({
      where: { slug: candidate }
    });
    if (!existing || existing.id === excludeId) return candidate;
    candidate = `${root}-${i}`;
  }
}
