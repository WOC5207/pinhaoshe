"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import {
  submitLotteryEntry,
  type LotteryEntryFormState
} from "@/app/[locale]/(public)/draw/actions";
import PublicLotteryDraw, {
  type PublicLotteryEntry,
  type PublicLotteryPrize
} from "./PublicLotteryDraw";

export interface PublicContactMethod {
  id: string;
  label: string; // already resolved to the current locale
}

const inputCls =
  "rounded-lg border border-border-strong bg-surface px-3 py-2 text-fg outline-none focus:border-fg-subtle";

export default function LotteryEntryForm({
  drawToken,
  contactMethods,
  spinEnabled,
  entries,
  prizes
}: {
  drawToken: string;
  contactMethods: PublicContactMethod[];
  spinEnabled: boolean;
  entries: PublicLotteryEntry[];
  prizes: PublicLotteryPrize[];
}) {
  const t = useTranslations("lotteryEntry");
  const [state, formAction, pending] = useActionState<
    LotteryEntryFormState,
    FormData
  >(submitLotteryEntry, {});

  // Either just entered, or already had an entry from a previous visit —
  // both return the visitor's own token, so either way they can move on to
  // the wheel.
  if (state.token) {
    return (
      <div className="flex flex-col gap-6">
        {state.ok ? (
          <div className="rounded-xl border border-success-border bg-success-surface p-6 text-center">
            <p className="text-sm text-success">{t("successNotice")}</p>
            <p className="mt-2 text-xs uppercase tracking-wide text-success">
              {t("yourToken")}
            </p>
            <p className="mt-1 font-mono text-2xl font-bold text-success-strong">
              {state.token}
            </p>
          </div>
        ) : (
          <p className="rounded-xl border border-border bg-surface p-6 text-center text-fg-subtle">
            {t("errorDuplicate")}
          </p>
        )}

        {spinEnabled ? (
          <PublicLotteryDraw
            drawToken={drawToken}
            myEntryToken={state.token}
            entries={entries}
            prizes={prizes}
          />
        ) : (
          <p className="rounded-xl border border-border bg-surface p-6 text-center text-fg-subtle">
            {t("spinNotStarted")}
          </p>
        )}
      </div>
    );
  }

  const errorMessage =
    state.error && state.error !== "duplicate"
      ? {
          validation: t("errorValidation"),
          rateLimited: t("errorRateLimited"),
          closed: t("errorClosed"),
          notFound: t("errorNotFound")
        }[state.error]
      : null;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="drawToken" value={drawToken} />
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-fg-muted">{t("name")} *</span>
        <input name="name" required maxLength={200} className={inputCls} />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-fg-muted">{t("contactMethod")} *</span>
          <select
            name="contactMethod"
            required
            defaultValue=""
            className={inputCls}
          >
            <option value="" disabled>
              {t("contactMethodPlaceholder")}
            </option>
            {contactMethods.map((m) => (
              <option key={m.id} value={m.label}>
                {m.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-fg-muted">{t("contactValue")} *</span>
          <input
            name="contactValue"
            required
            maxLength={200}
            className={inputCls}
          />
        </label>
      </div>

      {errorMessage && (
        <p className="rounded-lg bg-danger-surface px-3 py-2 text-sm text-danger">
          {errorMessage}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-fg px-6 py-3 text-sm font-semibold text-page transition hover:opacity-90 disabled:opacity-50"
      >
        {t("submit")}
      </button>
    </form>
  );
}
