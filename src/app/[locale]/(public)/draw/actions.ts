"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { spinForEntry, uniqueEntryToken } from "@/lib/lottery";

export type LotteryEntryFormState = {
  error?: "validation" | "rateLimited" | "closed" | "duplicate" | "notFound";
  ok?: boolean;
  // The visitor's own entry token, shown as a confirmation and used to
  // identify their entry for spinning — returned both on a fresh entry and
  // on "duplicate" (a returning visitor), so either way they can get to the
  // wheel without needing an account.
  token?: string;
};

const entrySchema = z.object({
  drawToken: z.string().trim().min(1).max(100),
  name: z.string().trim().min(1).max(200),
  contactMethod: z.string().trim().min(1).max(60),
  contactValue: z.string().trim().min(1).max(200)
});

export async function submitLotteryEntry(
  _prev: LotteryEntryFormState,
  formData: FormData
): Promise<LotteryEntryFormState> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (!rateLimit(`lottery-entry:${ip}`, { limit: 8, windowMs: 60 * 60 * 1000 })) {
    return { error: "rateLimited" };
  }

  const parsed = entrySchema.safeParse({
    drawToken: formData.get("drawToken") ?? "",
    name: formData.get("name") ?? "",
    contactMethod: formData.get("contactMethod") ?? "",
    contactValue: formData.get("contactValue") ?? ""
  });
  if (!parsed.success) return { error: "validation" };
  const d = parsed.data;

  const draw = await prisma.lotteryDraw.findUnique({
    where: { token: d.drawToken }
  });
  if (!draw) return { error: "notFound" };

  // Checked before the open/closed gate: a visitor re-submitting their own
  // details to get back to the wheel should always be recognized, even
  // after the admin has closed new entries to start the live draw.
  const normalizedValue = d.contactValue.trim().toLowerCase();
  const existingSelfEntries = await prisma.lotteryEntry.findMany({
    where: { drawId: draw.id, bookingId: null, contactMethod: d.contactMethod }
  });
  const existing = existingSelfEntries.find(
    (e) => e.contactValue.trim().toLowerCase() === normalizedValue
  );
  if (existing) return { error: "duplicate", token: existing.token };

  if (!draw.open) return { error: "closed" };

  const entryToken = await uniqueEntryToken(draw.id);
  await prisma.lotteryEntry.create({
    data: {
      drawId: draw.id,
      name: d.name,
      contactMethod: d.contactMethod,
      contactValue: d.contactValue,
      token: entryToken
    }
  });

  return { ok: true, token: entryToken };
}

export type PublicSpinResult =
  | {
      ok: true;
      winner: {
        entryId: string;
        token: string;
        name: string;
        characterName: string;
        prizeId: string;
        prizeName: string;
      };
    }
  | {
      ok: false;
      error: "rateLimited" | "spinDisabled" | "notFound" | "alreadySpun" | "noPrizesLeft";
    };

const ERROR_MAP = {
  not_found: "notFound",
  already_spun: "alreadySpun",
  no_prizes_left: "noPrizesLeft"
} as const;

/**
 * Self-serve spin for a visitor on the public entry-link page, identified by
 * their own short entry token (the same one shown to them as a
 * confirmation) rather than an internal id. The prize is chosen server-side
 * by weighted random draw among prizes still in stock — see spinForEntry.
 * Gated behind the admin's spinEnabled toggle.
 */
export async function spinMyLotteryEntry(
  drawToken: string,
  entryToken: string
): Promise<PublicSpinResult> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (!rateLimit(`lottery-spin:${ip}`, { limit: 20, windowMs: 60 * 60 * 1000 })) {
    return { ok: false, error: "rateLimited" };
  }

  const draw = await prisma.lotteryDraw.findUnique({ where: { token: drawToken } });
  if (!draw) return { ok: false, error: "notFound" };
  if (!draw.spinEnabled) return { ok: false, error: "spinDisabled" };

  const entry = await prisma.lotteryEntry.findUnique({
    where: { drawId_token: { drawId: draw.id, token: entryToken } }
  });
  if (!entry) return { ok: false, error: "notFound" };

  const result = await spinForEntry(entry.id, draw.id);
  if (result.ok) return result;
  return { ok: false, error: ERROR_MAP[result.error] };
}
