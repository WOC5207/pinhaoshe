"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/auth";
import { deleteEventFiles, deletePhotoFiles } from "@/lib/images";

export type EventFormState = { error?: "validation" | "unknown"; ok?: boolean };

const eventSchema = z
  .object({
    titleEn: z.string().trim().max(300),
    titleZh: z.string().trim().max(300),
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .regex(/^[a-z0-9-]*$/)
      .max(100),
    date: z.string().trim().max(30),
    location: z.string().trim().max(300),
    descriptionEn: z.string().trim().max(5000),
    descriptionZh: z.string().trim().max(5000),
    published: z.boolean()
  })
  .refine((d) => d.titleEn.length > 0 || d.titleZh.length > 0);

function parseEventForm(formData: FormData) {
  return eventSchema.safeParse({
    titleEn: formData.get("titleEn") ?? "",
    titleZh: formData.get("titleZh") ?? "",
    slug: formData.get("slug") ?? "",
    date: formData.get("date") ?? "",
    location: formData.get("location") ?? "",
    descriptionEn: formData.get("descriptionEn") ?? "",
    descriptionZh: formData.get("descriptionZh") ?? "",
    published: formData.get("published") === "on"
  });
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

async function uniqueSlug(base: string, excludeId?: string): Promise<string> {
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

async function guard(): Promise<string> {
  const locale = await getLocale();
  if (!(await isAdmin())) redirect(`/${locale}/admin/login`);
  return locale;
}

function toDate(value: string): Date | null {
  if (!value) return null;
  const d = new Date(`${value}T00:00:00Z`);
  return isNaN(d.getTime()) ? null : d;
}

export async function createEvent(
  _prev: EventFormState,
  formData: FormData
): Promise<EventFormState> {
  const locale = await guard();
  const parsed = parseEventForm(formData);
  if (!parsed.success) return { error: "validation" };
  const d = parsed.data;

  const slug = await uniqueSlug(d.slug || slugify(d.titleEn || d.titleZh));
  const event = await prisma.event.create({
    data: {
      slug,
      titleEn: d.titleEn,
      titleZh: d.titleZh,
      descriptionEn: d.descriptionEn,
      descriptionZh: d.descriptionZh,
      location: d.location,
      date: toDate(d.date),
      published: d.published
    }
  });

  revalidatePath("/", "layout");
  redirect(`/${locale}/admin/events/${event.id}`);
}

export async function updateEvent(
  _prev: EventFormState,
  formData: FormData
): Promise<EventFormState> {
  await guard();
  const id = formData.get("id");
  if (typeof id !== "string") return { error: "unknown" };
  const parsed = parseEventForm(formData);
  if (!parsed.success) return { error: "validation" };
  const d = parsed.data;

  const existing = await prisma.event.findUnique({ where: { id } });
  if (!existing) return { error: "unknown" };

  const slug = await uniqueSlug(
    d.slug || slugify(d.titleEn || d.titleZh),
    id
  );
  await prisma.event.update({
    where: { id },
    data: {
      slug,
      titleEn: d.titleEn,
      titleZh: d.titleZh,
      descriptionEn: d.descriptionEn,
      descriptionZh: d.descriptionZh,
      location: d.location,
      date: toDate(d.date),
      published: d.published
    }
  });

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteEvent(formData: FormData): Promise<void> {
  const locale = await guard();
  const id = formData.get("id");
  if (typeof id !== "string") return;

  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) return;

  await prisma.event.delete({ where: { id } });
  await deleteEventFiles(id);

  revalidatePath("/", "layout");
  redirect(`/${locale}/admin/events`);
}

export async function updatePhotoCredit(formData: FormData): Promise<void> {
  await guard();
  const photoId = formData.get("photoId");
  if (typeof photoId !== "string") return;
  const cosplayerCn = String(formData.get("cosplayerCn") ?? "")
    .trim()
    .slice(0, 200);
  const characterName = String(formData.get("characterName") ?? "")
    .trim()
    .slice(0, 200);
  // Cosplayer CN is required; ignore submissions that would blank it out
  // (the form also enforces this client-side via the input's required attribute).
  if (!cosplayerCn) return;

  await prisma.photo
    .update({ where: { id: photoId }, data: { cosplayerCn, characterName } })
    .catch(() => {});
  revalidatePath("/", "layout");
}

export async function deletePhoto(formData: FormData): Promise<void> {
  await guard();
  const photoId = formData.get("photoId");
  if (typeof photoId !== "string") return;

  const photo = await prisma.photo.findUnique({ where: { id: photoId } });
  if (!photo) return;

  await prisma.photo.delete({ where: { id: photoId } });
  await deletePhotoFiles(photo.eventId, photo.id, photo.filename);
  revalidatePath("/", "layout");
}

export async function setCoverPhoto(formData: FormData): Promise<void> {
  await guard();
  const photoId = formData.get("photoId");
  if (typeof photoId !== "string") return;

  const photo = await prisma.photo.findUnique({ where: { id: photoId } });
  if (!photo) return;

  await prisma.event.update({
    where: { id: photo.eventId },
    data: { coverPhotoId: photo.id }
  });
  revalidatePath("/", "layout");
}

export async function movePhoto(formData: FormData): Promise<void> {
  await guard();
  const photoId = formData.get("photoId");
  const direction = formData.get("direction");
  if (typeof photoId !== "string" || (direction !== "up" && direction !== "down"))
    return;

  const photo = await prisma.photo.findUnique({ where: { id: photoId } });
  if (!photo) return;

  await prisma.$transaction(async (tx) => {
    const photos = await tx.photo.findMany({
      where: { eventId: photo.eventId },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: { id: true }
    });
    const index = photos.findIndex((p) => p.id === photoId);
    const swapWith = direction === "up" ? index - 1 : index + 1;
    if (index < 0 || swapWith < 0 || swapWith >= photos.length) return;

    // Normalize to contiguous order, then swap the two neighbours.
    const order = photos.map((p) => p.id);
    [order[index], order[swapWith]] = [order[swapWith], order[index]];
    for (let i = 0; i < order.length; i++) {
      await tx.photo.update({
        where: { id: order[i] },
        data: { sortOrder: i + 1 }
      });
    }
  });
  revalidatePath("/", "layout");
}
