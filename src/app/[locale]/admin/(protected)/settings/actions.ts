"use server";

import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { isAdmin, requireAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SITE_SETTINGS_ID } from "@/lib/settings";
import { deleteSiteImageFile } from "@/lib/images";

export type SiteSettingsState = { error?: "validation"; ok?: boolean };

async function guard(): Promise<void> {
  const locale = await getLocale();
  await requireAdmin(locale);
}

const settingsSchema = z.object({
  siteTitleEn: z.string().trim().max(120),
  siteTitleZh: z.string().trim().max(120),
  homeTitleEn: z.string().trim().max(200),
  homeTitleZh: z.string().trim().max(200),
  homeSubtitleEn: z.string().trim().max(300),
  homeSubtitleZh: z.string().trim().max(300),
  // Empty (theme default) or a #rgb / #rrggbb hex color.
  backgroundColor: z
    .string()
    .trim()
    .regex(/^(#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}))?$/),
  bookingEnabled: z.boolean(),
  lotteryEnabled: z.boolean(),
  cosplayersEnabled: z.boolean()
});

export async function updateSiteSettings(
  _prev: SiteSettingsState,
  formData: FormData
): Promise<SiteSettingsState> {
  await guard();

  const parsed = settingsSchema.safeParse({
    siteTitleEn: formData.get("siteTitleEn") ?? "",
    siteTitleZh: formData.get("siteTitleZh") ?? "",
    homeTitleEn: formData.get("homeTitleEn") ?? "",
    homeTitleZh: formData.get("homeTitleZh") ?? "",
    homeSubtitleEn: formData.get("homeSubtitleEn") ?? "",
    homeSubtitleZh: formData.get("homeSubtitleZh") ?? "",
    backgroundColor: formData.get("backgroundColor") ?? "",
    bookingEnabled: formData.get("bookingEnabled") === "on",
    lotteryEnabled: formData.get("lotteryEnabled") === "on",
    cosplayersEnabled: formData.get("cosplayersEnabled") === "on"
  });
  if (!parsed.success) return { error: "validation" };
  const d = parsed.data;

  await prisma.siteSettings.upsert({
    where: { id: SITE_SETTINGS_ID },
    create: {
      id: SITE_SETTINGS_ID,
      siteTitleEn: d.siteTitleEn,
      siteTitleZh: d.siteTitleZh,
      homeTitleEn: d.homeTitleEn,
      homeTitleZh: d.homeTitleZh,
      homeSubtitleEn: d.homeSubtitleEn,
      homeSubtitleZh: d.homeSubtitleZh,
      backgroundColor: d.backgroundColor,
      bookingEnabled: d.bookingEnabled,
      lotteryEnabled: d.lotteryEnabled,
      cosplayersEnabled: d.cosplayersEnabled
    },
    update: {
      siteTitleEn: d.siteTitleEn,
      siteTitleZh: d.siteTitleZh,
      homeTitleEn: d.homeTitleEn,
      homeTitleZh: d.homeTitleZh,
      homeSubtitleEn: d.homeSubtitleEn,
      homeSubtitleZh: d.homeSubtitleZh,
      backgroundColor: d.backgroundColor,
      bookingEnabled: d.bookingEnabled,
      lotteryEnabled: d.lotteryEnabled,
      cosplayersEnabled: d.cosplayersEnabled
    }
  });

  revalidatePath("/", "layout");
  return { ok: true };
}

export type PersonalLinkState = { error?: "validation"; ok?: boolean };

const personalLinkSchema = z
  .object({
    labelEn: z.string().trim().max(200),
    labelZh: z.string().trim().max(200),
    url: z.string().trim().max(500)
  })
  .refine((d) => d.labelEn.length > 0 || d.labelZh.length > 0);

function parsePersonalLinkForm(formData: FormData) {
  return personalLinkSchema.safeParse({
    labelEn: formData.get("labelEn") ?? "",
    labelZh: formData.get("labelZh") ?? "",
    url: formData.get("url") ?? ""
  });
}

export async function addPersonalLink(
  _prev: PersonalLinkState,
  formData: FormData
): Promise<PersonalLinkState> {
  await guard();
  const parsed = parsePersonalLinkForm(formData);
  if (!parsed.success) return { error: "validation" };
  const d = parsed.data;

  const maxOrder = await prisma.personalLink.aggregate({
    _max: { sortOrder: true }
  });
  await prisma.personalLink.create({
    data: {
      labelEn: d.labelEn,
      labelZh: d.labelZh,
      url: d.url,
      sortOrder: (maxOrder._max.sortOrder ?? 0) + 1
    }
  });

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function updatePersonalLink(formData: FormData): Promise<void> {
  await guard();
  const id = formData.get("id");
  if (typeof id !== "string") return;
  const parsed = parsePersonalLinkForm(formData);
  if (!parsed.success) return;
  const d = parsed.data;

  await prisma.personalLink
    .update({
      where: { id },
      data: { labelEn: d.labelEn, labelZh: d.labelZh, url: d.url }
    })
    .catch(() => {});
  revalidatePath("/", "layout");
}

export async function deletePersonalLink(formData: FormData): Promise<void> {
  await guard();
  const id = formData.get("id");
  if (typeof id !== "string") return;
  await prisma.personalLink.delete({ where: { id } }).catch(() => {});
  revalidatePath("/", "layout");
}

export async function movePersonalLink(formData: FormData): Promise<void> {
  await guard();
  const id = formData.get("id");
  const direction = formData.get("direction");
  if (typeof id !== "string" || (direction !== "up" && direction !== "down"))
    return;

  await prisma.$transaction(async (tx) => {
    const links = await tx.personalLink.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: { id: true }
    });
    const index = links.findIndex((l) => l.id === id);
    const swapWith = direction === "up" ? index - 1 : index + 1;
    if (index < 0 || swapWith < 0 || swapWith >= links.length) return;

    const order = links.map((l) => l.id);
    [order[index], order[swapWith]] = [order[swapWith], order[index]];
    for (let i = 0; i < order.length; i++) {
      await tx.personalLink.update({
        where: { id: order[i] },
        data: { sortOrder: i + 1 }
      });
    }
  });
  revalidatePath("/", "layout");
}

export type ContactMethodState = { error?: "validation"; ok?: boolean };

const contactMethodSchema = z
  .object({
    labelEn: z.string().trim().max(60),
    labelZh: z.string().trim().max(60)
  })
  .refine((d) => d.labelEn.length > 0 || d.labelZh.length > 0);

function parseContactMethodForm(formData: FormData) {
  return contactMethodSchema.safeParse({
    labelEn: formData.get("labelEn") ?? "",
    labelZh: formData.get("labelZh") ?? ""
  });
}

export async function addContactMethod(
  _prev: ContactMethodState,
  formData: FormData
): Promise<ContactMethodState> {
  await guard();
  const parsed = parseContactMethodForm(formData);
  if (!parsed.success) return { error: "validation" };
  const d = parsed.data;

  const maxOrder = await prisma.contactMethod.aggregate({
    _max: { sortOrder: true }
  });
  await prisma.contactMethod.create({
    data: {
      labelEn: d.labelEn,
      labelZh: d.labelZh,
      sortOrder: (maxOrder._max.sortOrder ?? 0) + 1
    }
  });

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function updateContactMethod(formData: FormData): Promise<void> {
  await guard();
  const id = formData.get("id");
  if (typeof id !== "string") return;
  const parsed = parseContactMethodForm(formData);
  if (!parsed.success) return;
  const d = parsed.data;

  await prisma.contactMethod
    .update({
      where: { id },
      data: { labelEn: d.labelEn, labelZh: d.labelZh }
    })
    .catch(() => {});
  revalidatePath("/", "layout");
}

export async function deleteContactMethod(formData: FormData): Promise<void> {
  await guard();
  const id = formData.get("id");
  if (typeof id !== "string") return;
  await prisma.contactMethod.delete({ where: { id } }).catch(() => {});
  revalidatePath("/", "layout");
}

export async function moveContactMethod(formData: FormData): Promise<void> {
  await guard();
  const id = formData.get("id");
  const direction = formData.get("direction");
  if (typeof id !== "string" || (direction !== "up" && direction !== "down"))
    return;

  await prisma.$transaction(async (tx) => {
    const methods = await tx.contactMethod.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: { id: true }
    });
    const index = methods.findIndex((m) => m.id === id);
    const swapWith = direction === "up" ? index - 1 : index + 1;
    if (index < 0 || swapWith < 0 || swapWith >= methods.length) return;

    const order = methods.map((m) => m.id);
    [order[index], order[swapWith]] = [order[swapWith], order[index]];
    for (let i = 0; i < order.length; i++) {
      await tx.contactMethod.update({
        where: { id: order[i] },
        data: { sortOrder: i + 1 }
      });
    }
  });
  revalidatePath("/", "layout");
}

export async function removeSiteImage(
  kind: "background" | "logo"
): Promise<void> {
  if (!(await isAdmin())) return;

  const existing = await prisma.siteSettings.findUnique({
    where: { id: SITE_SETTINGS_ID },
    select: { backgroundImage: true, logo: true }
  });
  const token = kind === "background" ? existing?.backgroundImage : existing?.logo;
  if (token) await deleteSiteImageFile(token);

  const cleared = kind === "background" ? { backgroundImage: "" } : { logo: "" };
  await prisma.siteSettings.upsert({
    where: { id: SITE_SETTINGS_ID },
    create: { id: SITE_SETTINGS_ID, ...cleared },
    update: cleared
  });

  revalidatePath("/", "layout");
  const locale = await getLocale();
  redirect(`/${locale}/admin/settings`);
}
