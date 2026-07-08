import "server-only";
import { randomBytes } from "crypto";
import { prisma } from "./db";

// Avoids visually ambiguous characters (0/O, 1/I) since tokens are read
// aloud/off a screen during the draw.
const TOKEN_CHARS = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

function randomToken(length = 5): string {
  const bytes = randomBytes(length);
  let s = "";
  for (let i = 0; i < length; i++) s += TOKEN_CHARS[bytes[i] % TOKEN_CHARS.length];
  return s;
}

/** A short display token unique within one draw (used on the wheel). */
export async function uniqueEntryToken(drawId: string): Promise<string> {
  for (let i = 0; i < 30; i++) {
    const token = randomToken();
    const existing = await prisma.lotteryEntry.findUnique({
      where: { drawId_token: { drawId, token } }
    });
    if (!existing) return token;
  }
  throw new Error("could not generate a unique lottery entry token");
}

export async function ensureLotteryDraw(bookingEventId: string) {
  const existing = await prisma.lotteryDraw.findUnique({
    where: { bookingEventId }
  });
  if (existing) return existing;
  return prisma.lotteryDraw.create({
    data: { bookingEventId, token: randomBytes(16).toString("hex") }
  });
}

export type SpinResult =
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
  | { ok: false; error: "not_found" | "already_spun" | "no_prizes_left" };

/**
 * Spins the wheel for one entry: picks a prize by weighted random draw among
 * whatever still has stock (an exhausted prize's weight simply drops out,
 * so remaining odds are always renormalized over what's left — this is a
 * "live weighted draw", not a pre-shuffled/guaranteed-fair sequence, so
 * visitors who spin earlier do get better odds at scarce prizes than ones
 * who spin after they run out), then persists the result. Runs inside a
 * transaction so two concurrent spins can't both claim the last unit of the
 * same prize. `expectedDrawId`, when passed, scopes the entry to a specific
 * draw (the public spin action uses this so a visitor can't reference an
 * entry from an unrelated draw).
 */
export async function spinForEntry(
  entryId: string,
  expectedDrawId?: string
): Promise<SpinResult> {
  return prisma.$transaction(async (tx) => {
    const entry = await tx.lotteryEntry.findUnique({ where: { id: entryId } });
    if (!entry) return { ok: false, error: "not_found" } as const;
    if (expectedDrawId && entry.drawId !== expectedDrawId) {
      return { ok: false, error: "not_found" } as const;
    }
    if (entry.wonPrizeId) return { ok: false, error: "already_spun" } as const;

    const prizes = await tx.lotteryPrize.findMany({ where: { drawId: entry.drawId } });
    const available: { id: string; name: string; weight: number }[] = [];
    for (const p of prizes) {
      const wonCount = await tx.lotteryEntry.count({ where: { wonPrizeId: p.id } });
      if (wonCount < p.quantity) available.push({ id: p.id, name: p.name, weight: p.weight });
    }
    if (available.length === 0) return { ok: false, error: "no_prizes_left" } as const;

    const totalWeight = available.reduce((sum, p) => sum + p.weight, 0);
    let roll = Math.random() * totalWeight;
    let chosen = available[available.length - 1];
    for (const p of available) {
      if (roll < p.weight) {
        chosen = p;
        break;
      }
      roll -= p.weight;
    }

    await tx.lotteryEntry.update({
      where: { id: entryId },
      data: { wonPrizeId: chosen.id, wonAt: new Date() }
    });

    return {
      ok: true,
      winner: {
        entryId: entry.id,
        token: entry.token,
        name: entry.name,
        characterName: entry.characterName,
        prizeId: chosen.id,
        prizeName: chosen.name
      }
    } as const;
  });
}
