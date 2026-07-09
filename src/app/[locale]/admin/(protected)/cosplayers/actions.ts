"use server";

import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { parseSocialLinksJson } from "@/lib/photoCredits";

async function guard(): Promise<void> {
  const locale = await getLocale();
  await requireAdmin(locale);
}

export type CosplayerState = { error?: "validation" | "duplicate"; ok?: boolean };

const cosplayerSchema = z.object({
  cosplayerCn: z.string().trim().min(1).max(200)
});

export async function addCosplayer(
  _prev: CosplayerState,
  formData: FormData
): Promise<CosplayerState> {
  await guard();
  const parsed = cosplayerSchema.safeParse({
    cosplayerCn: formData.get("cosplayerCn") ?? ""
  });
  if (!parsed.success) return { error: "validation" };

  try {
    await prisma.cosplayer.create({ data: { cosplayerCn: parsed.data.cosplayerCn } });
  } catch {
    // Unique constraint on cosplayerCn.
    return { error: "duplicate" };
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

/**
 * Renames a cosplayer and replaces their remembered social links in one
 * save. Silently no-ops on a duplicate-CN rename (matching the app's
 * existing defensive style for these inline-edit forms) rather than
 * crashing the page.
 */
export async function updateCosplayer(formData: FormData): Promise<void> {
  await guard();
  const id = formData.get("id");
  if (typeof id !== "string") return;
  const cosplayerCn = String(formData.get("cosplayerCn") ?? "").trim().slice(0, 200);
  if (!cosplayerCn) return;
  const socialLinks = parseSocialLinksJson(formData.get("socialLinksJson"));

  try {
    await prisma.$transaction([
      prisma.cosplayer.update({ where: { id }, data: { cosplayerCn } }),
      prisma.cosplayerSocialLink.deleteMany({ where: { cosplayerId: id } }),
      prisma.cosplayerSocialLink.createMany({
        data: socialLinks.map((s, i) => ({
          cosplayerId: id,
          platform: s.platform,
          url: s.url,
          sortOrder: i
        }))
      })
    ]);
  } catch {
    // Likely a duplicate cosplayerCn from the rename.
  }
  revalidatePath("/", "layout");
}

export async function deleteCosplayer(formData: FormData): Promise<void> {
  await guard();
  const id = formData.get("id");
  if (typeof id !== "string") return;
  await prisma.cosplayer.delete({ where: { id } }).catch(() => {});
  revalidatePath("/", "layout");
}
