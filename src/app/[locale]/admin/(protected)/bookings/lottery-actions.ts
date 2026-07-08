"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/auth";
import {
  ensureLotteryDraw,
  spinForEntry,
  uniqueEntryToken,
  type SpinResult
} from "@/lib/lottery";

async function guard(): Promise<void> {
  if (!(await isAdmin())) throw new Error("unauthorized");
}

/**
 * Master switch for the whole prize-draw tool on one booking event. Off by
 * default; while off, the "Prize draw" link is hidden from the event page
 * and the public entry link 404s, regardless of the draw's own open/
 * spinEnabled toggles underneath.
 */
export async function updateLotteryEnabled(formData: FormData): Promise<void> {
  await guard();
  const bookingEventId = formData.get("bookingEventId");
  if (typeof bookingEventId !== "string") return;
  const lotteryEnabled = formData.get("lotteryEnabled") === "on";
  await prisma.bookingEvent
    .update({ where: { id: bookingEventId }, data: { lotteryEnabled } })
    .catch(() => {});
  revalidatePath("/", "layout");
}

export async function addLotteryEntries(formData: FormData): Promise<void> {
  await guard();
  const bookingEventId = formData.get("bookingEventId");
  if (typeof bookingEventId !== "string") return;
  const bookingIds = formData
    .getAll("bookingIds")
    .filter((v): v is string => typeof v === "string");
  if (bookingIds.length === 0) return;

  const draw = await ensureLotteryDraw(bookingEventId);
  const bookings = await prisma.booking.findMany({
    where: { id: { in: bookingIds } }
  });

  for (const booking of bookings) {
    const token = await uniqueEntryToken(draw.id);
    await prisma.lotteryEntry
      .create({
        data: {
          drawId: draw.id,
          bookingId: booking.id,
          name: booking.name,
          characterName: booking.characterName,
          token
        }
      })
      .catch(() => {});
  }
  revalidatePath("/", "layout");
}

export async function removeLotteryEntry(formData: FormData): Promise<void> {
  await guard();
  const entryId = formData.get("entryId");
  if (typeof entryId !== "string") return;
  await prisma.lotteryEntry.delete({ where: { id: entryId } }).catch(() => {});
  revalidatePath("/", "layout");
}

export async function updateLotteryDrawOpen(formData: FormData): Promise<void> {
  await guard();
  const drawId = formData.get("drawId");
  if (typeof drawId !== "string") return;
  const open = formData.get("open") === "on";
  await prisma.lotteryDraw.update({ where: { id: drawId }, data: { open } }).catch(() => {});
  revalidatePath("/", "layout");
}

export async function updateLotterySpinEnabled(formData: FormData): Promise<void> {
  await guard();
  const drawId = formData.get("drawId");
  if (typeof drawId !== "string") return;
  const spinEnabled = formData.get("spinEnabled") === "on";
  await prisma.lotteryDraw
    .update({ where: { id: drawId }, data: { spinEnabled } })
    .catch(() => {});
  revalidatePath("/", "layout");
}

export type LotteryPrizeState = { error?: "validation"; ok?: boolean };

const prizeSchema = z.object({
  name: z.string().trim().min(1).max(200),
  quantity: z.coerce.number().int().min(1).max(9999),
  weight: z.coerce.number().int().min(1).max(9999)
});

export async function addLotteryPrize(
  _prev: LotteryPrizeState,
  formData: FormData
): Promise<LotteryPrizeState> {
  await guard();
  const bookingEventId = formData.get("bookingEventId");
  if (typeof bookingEventId !== "string") return { error: "validation" };
  const parsed = prizeSchema.safeParse({
    name: formData.get("name") ?? "",
    quantity: formData.get("quantity") ?? "",
    weight: formData.get("weight") ?? ""
  });
  if (!parsed.success) return { error: "validation" };

  const draw = await ensureLotteryDraw(bookingEventId);
  const count = await prisma.lotteryPrize.count({ where: { drawId: draw.id } });
  await prisma.lotteryPrize.create({
    data: {
      drawId: draw.id,
      name: parsed.data.name,
      quantity: parsed.data.quantity,
      weight: parsed.data.weight,
      sortOrder: count
    }
  });
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function updateLotteryPrize(formData: FormData): Promise<void> {
  await guard();
  const prizeId = formData.get("prizeId");
  if (typeof prizeId !== "string") return;
  const parsed = prizeSchema.safeParse({
    name: formData.get("name") ?? "",
    quantity: formData.get("quantity") ?? "",
    weight: formData.get("weight") ?? ""
  });
  if (!parsed.success) return;

  await prisma.lotteryPrize
    .update({
      where: { id: prizeId },
      data: {
        name: parsed.data.name,
        quantity: parsed.data.quantity,
        weight: parsed.data.weight
      }
    })
    .catch(() => {});
  revalidatePath("/", "layout");
}

/**
 * Deleting a prize releases any entries that had won it back into the pool
 * (rather than leaving them permanently marked as winners of a prize that no
 * longer exists), so the admin can safely re-run that portion of the draw.
 */
export async function deleteLotteryPrize(formData: FormData): Promise<void> {
  await guard();
  const prizeId = formData.get("prizeId");
  if (typeof prizeId !== "string") return;

  await prisma.$transaction([
    prisma.lotteryEntry.updateMany({
      where: { wonPrizeId: prizeId },
      data: { wonPrizeId: null, wonAt: null }
    }),
    prisma.lotteryPrize.delete({ where: { id: prizeId } })
  ]);
  revalidatePath("/", "layout");
}

export type { SpinResult };

/**
 * Spins the wheel on behalf of one entry (e.g. the admin running the draw
 * in person for a walk-up entrant without their own device). The prize is
 * chosen server-side by weighted random draw among prizes still in stock —
 * see spinForEntry for the fairness model.
 */
export async function spinLotteryEntry(entryId: string): Promise<SpinResult> {
  await guard();
  const result = await spinForEntry(entryId);
  revalidatePath("/", "layout");
  return result;
}
