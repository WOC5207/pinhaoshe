"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  spinMyLotteryEntry,
  type PublicSpinResult
} from "@/app/[locale]/(public)/draw/actions";
import LotteryWheel from "@/components/admin/LotteryWheel";

export interface PublicLotteryEntry {
  id: string;
  token: string;
  name: string;
  characterName: string;
  wonPrizeId: string | null;
}

export interface PublicLotteryPrize {
  id: string;
  name: string;
  quantity: number;
  weight: number;
  wonCount: number;
}

type LotteryWinner = Extract<PublicSpinResult, { ok: true }>["winner"];

function displayName(b: { name: string; characterName: string }) {
  return b.characterName ? `${b.name} · ${b.characterName}` : b.name;
}

export default function PublicLotteryDraw({
  drawToken,
  myEntryToken,
  entries,
  prizes
}: {
  drawToken: string;
  myEntryToken: string;
  entries: PublicLotteryEntry[];
  prizes: PublicLotteryPrize[];
}) {
  const t = useTranslations("lotteryEntry");

  const myEntry = entries.find((e) => e.token === myEntryToken);
  const myPrize = myEntry?.wonPrizeId
    ? prizes.find((p) => p.id === myEntry.wonPrizeId)
    : undefined;

  const wheelSlices = useMemo(
    () =>
      prizes
        .filter((p) => p.quantity - p.wonCount > 0)
        .map((p) => ({ id: p.id, label: p.name, weight: p.weight })),
    [prizes]
  );

  const [spinning, setSpinning] = useState(false);
  const [targetIndex, setTargetIndex] = useState<number | null>(null);
  const [pendingWinner, setPendingWinner] = useState<LotteryWinner | null>(null);
  const [revealedWinner, setRevealedWinner] = useState<LotteryWinner | undefined>();
  const [spinError, setSpinError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Already spun (from a previous visit, or earlier this session) — just
  // show what they won, no wheel needed.
  if (myEntry?.wonPrizeId) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-surface p-6">
        <h2 className="text-lg font-semibold">{t("spinTitle")}</h2>
        <div className="w-full rounded-lg border border-success-border bg-success-surface p-4 text-center">
          <p className="text-xs uppercase tracking-wide text-success">
            {t("alreadySpunNotice")}
          </p>
          <p className="mt-1 text-lg font-bold text-success-strong">
            {myPrize?.name ?? ""}
          </p>
        </div>
      </div>
    );
  }

  const canSpin = !spinning && !busy && wheelSlices.length > 0;

  async function handleSpin() {
    if (!canSpin) return;
    setSpinError(null);
    setRevealedWinner(undefined);
    setBusy(true);
    const result = await spinMyLotteryEntry(drawToken, myEntryToken);
    setBusy(false);
    if (!result.ok) {
      setSpinError(result.error);
      return;
    }
    const idx = wheelSlices.findIndex((s) => s.id === result.winner.prizeId);
    if (idx === -1) {
      setRevealedWinner(result.winner);
      return;
    }
    setPendingWinner(result.winner);
    setTargetIndex(idx);
    setSpinning(true);
  }

  function handleSpinComplete() {
    setSpinning(false);
    setRevealedWinner(pendingWinner ?? undefined);
    setPendingWinner(null);
  }

  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-surface p-6">
      <h2 className="text-lg font-semibold">{t("spinTitle")}</h2>

      <LotteryWheel
        slices={wheelSlices}
        spinning={spinning}
        targetIndex={targetIndex}
        onSpinComplete={handleSpinComplete}
      />

      <button
        type="button"
        onClick={handleSpin}
        disabled={!canSpin}
        className="rounded-full bg-fg px-6 py-3 text-sm font-semibold text-page transition hover:opacity-90 disabled:opacity-50"
      >
        {spinning ? t("spinning") : t("spin")}
      </button>

      {wheelSlices.length === 0 && (
        <p className="text-xs text-fg-subtle">{t("noPrizesYet")}</p>
      )}

      {spinError && (
        <p className="text-xs text-danger">{t(`spinError_${spinError}`)}</p>
      )}

      {revealedWinner && (
        <div className="w-full rounded-lg border border-success-border bg-success-surface p-4 text-center">
          <p className="text-xs uppercase tracking-wide text-success">
            {t("winnerNotice")}
          </p>
          <p className="mt-1 text-lg font-bold text-success-strong">
            {revealedWinner.prizeName}
          </p>
        </div>
      )}

      {entries.some((e) => e.wonPrizeId) && (
        <div className="w-full border-t border-border pt-3">
          <p className="mb-2 text-xs font-semibold text-fg-subtle">
            {t("winnersHistory")}
          </p>
          <ul className="flex flex-col gap-1 text-sm">
            {entries
              .filter((e) => e.wonPrizeId)
              .map((e) => (
                <li key={e.id} className="flex justify-between gap-2">
                  <span>{displayName(e)}</span>
                  <span className="text-fg-subtle">
                    {prizes.find((p) => p.id === e.wonPrizeId)?.name}
                  </span>
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );
}
