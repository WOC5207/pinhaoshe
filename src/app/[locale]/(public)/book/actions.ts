"use server";

import { randomUUID } from "crypto";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { config } from "@/lib/config";
import { rateLimit } from "@/lib/rate-limit";
import { pickText } from "@/lib/content";
import { notifyBookingCreated } from "@/lib/notify";

export type BookingFormState = {
  error?:
    | "validation"
    | "slotFull"
    | "slotUnavailable"
    | "rateLimited"
    | "closed";
};

const bookingSchema = z.object({
  slotId: z.string().min(1).max(100),
  name: z.string().trim().min(1).max(200),
  characterName: z.string().trim().max(200),
  contactMethod: z.string().trim().min(1).max(60),
  contactValue: z.string().trim().min(1).max(200),
  notes: z.string().trim().max(2000)
});

export async function createBooking(
  _prev: BookingFormState,
  formData: FormData
): Promise<BookingFormState> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (!rateLimit(`book:${ip}`, { limit: 8, windowMs: 60 * 60 * 1000 })) {
    return { error: "rateLimited" };
  }

  const parsed = bookingSchema.safeParse({
    slotId: formData.get("slotId") ?? "",
    name: formData.get("name") ?? "",
    characterName: formData.get("characterName") ?? "",
    contactMethod: formData.get("contactMethod") ?? "",
    contactValue: formData.get("contactValue") ?? "",
    notes: formData.get("notes") ?? ""
  });
  if (!parsed.success) return { error: "validation" };
  const d = parsed.data;

  const cancelToken = randomUUID().replace(/-/g, "");

  // Atomic capacity check + insert. With SQLite's serialized writes
  // (connection_limit=1) two concurrent attempts on the last spot cannot
  // both pass the count check.
  const result = await prisma.$transaction(async (tx) => {
    const slot = await tx.timeSlot.findUnique({
      where: { id: d.slotId },
      include: { bookingEvent: true }
    });
    if (!slot) return { error: "slotUnavailable" as const };
    if (!slot.bookingEvent.open) return { error: "closed" as const };

    const confirmed = await tx.booking.count({
      where: { timeSlotId: slot.id, status: "confirmed" }
    });
    if (confirmed >= slot.capacity) return { error: "slotFull" as const };

    await tx.booking.create({
      data: {
        timeSlotId: slot.id,
        name: d.name,
        characterName: d.characterName,
        contactMethod: d.contactMethod,
        contactValue: d.contactValue,
        notes: d.notes,
        cancelToken
      }
    });
    return { slot };
  });

  if ("error" in result) return { error: result.error };

  const locale = await getLocale();
  const manageUrl = `${config.appBaseUrl()}/${locale}/my-booking/${cancelToken}`;
  // Fire-and-forget notification hook (no-op until SMTP is configured)
  notifyBookingCreated({
    bookingId: cancelToken,
    name: d.name,
    characterName: d.characterName,
    contactMethod: d.contactMethod,
    contactValue: d.contactValue,
    eventTitle: pickText(
      locale,
      result.slot.bookingEvent.titleEn,
      result.slot.bookingEvent.titleZh
    ),
    slotStart: result.slot.startTime,
    slotEnd: result.slot.endTime,
    manageUrl
  }).catch(() => {});

  redirect(`/${locale}/my-booking/${cancelToken}?new=1`);
}

export async function cancelMyBooking(formData: FormData): Promise<void> {
  const cancelToken = formData.get("cancelToken");
  if (typeof cancelToken !== "string" || cancelToken.length > 100) return;

  await prisma.booking
    .update({
      where: { cancelToken },
      data: { status: "cancelled" }
    })
    .catch(() => {});
  revalidatePath("/", "layout");
}
