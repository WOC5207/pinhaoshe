"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import {
  updateSiteSettings,
  type SiteSettingsState
} from "@/app/[locale]/admin/(protected)/settings/actions";

const inputCls =
  "rounded-lg border border-border-strong bg-surface px-3 py-2 text-fg outline-none focus:border-fg-subtle";

const THEME_DEFAULT_COLOR = "#0a0a0a";

export default function SiteSettingsForm({
  initial
}: {
  initial: {
    siteTitleEn: string;
    siteTitleZh: string;
    homeTitleEn: string;
    homeTitleZh: string;
    homeSubtitleEn: string;
    homeSubtitleZh: string;
    backgroundColor: string;
  };
}) {
  const t = useTranslations("adminSite");
  const tc = useTranslations("common");
  const [state, formAction, pending] = useActionState<
    SiteSettingsState,
    FormData
  >(updateSiteSettings, {});

  const [color, setColor] = useState(initial.backgroundColor);

  return (
    <form action={formAction} className="flex flex-col gap-8">
      {/* Site title */}
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">{t("siteTitleSection")}</h2>
        <p className="-mt-1 text-xs text-fg-subtle">{t("siteTitleHint")}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-fg-muted">{t("siteTitleEn")}</span>
            <input
              name="siteTitleEn"
              defaultValue={initial.siteTitleEn}
              maxLength={120}
              className={inputCls}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-fg-muted">{t("siteTitleZh")}</span>
            <input
              name="siteTitleZh"
              defaultValue={initial.siteTitleZh}
              maxLength={120}
              className={inputCls}
            />
          </label>
        </div>
      </section>

      {/* Homepage hero text */}
      <section className="flex flex-col gap-3 border-t border-border pt-6">
        <h2 className="text-lg font-semibold">{t("homeTextSection")}</h2>
        <p className="-mt-1 text-xs text-fg-subtle">{t("homeTextHint")}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-fg-muted">{t("homeTitleEn")}</span>
            <input
              name="homeTitleEn"
              defaultValue={initial.homeTitleEn}
              maxLength={200}
              className={inputCls}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-fg-muted">{t("homeTitleZh")}</span>
            <input
              name="homeTitleZh"
              defaultValue={initial.homeTitleZh}
              maxLength={200}
              className={inputCls}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-fg-muted">{t("homeSubtitleEn")}</span>
            <input
              name="homeSubtitleEn"
              defaultValue={initial.homeSubtitleEn}
              maxLength={300}
              className={inputCls}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-fg-muted">{t("homeSubtitleZh")}</span>
            <input
              name="homeSubtitleZh"
              defaultValue={initial.homeSubtitleZh}
              maxLength={300}
              className={inputCls}
            />
          </label>
        </div>
      </section>

      {/* Background color */}
      <section className="flex flex-col gap-3 border-t border-border pt-6">
        <h2 className="text-lg font-semibold">{t("backgroundColorSection")}</h2>
        <p className="-mt-1 text-xs text-fg-subtle">
          {t("backgroundColorHint")}
        </p>
        <div className="flex items-center gap-3">
          <input
            type="color"
            aria-label={t("backgroundColorSection")}
            value={color || THEME_DEFAULT_COLOR}
            onChange={(e) => setColor(e.target.value)}
            className="h-10 w-14 cursor-pointer rounded-md border border-border-strong bg-surface"
          />
          <span className="font-mono text-sm text-fg-muted">
            {color || t("colorDefault")}
          </span>
          {color && (
            <button
              type="button"
              onClick={() => setColor("")}
              className="rounded-md border border-border-strong px-2 py-1 text-xs text-fg-muted transition hover:border-fg-faint hover:text-fg"
            >
              {t("resetColor")}
            </button>
          )}
          <input type="hidden" name="backgroundColor" value={color} />
        </div>
      </section>

      {state.error && (
        <p className="rounded-lg bg-danger-surface px-3 py-2 text-sm text-danger">
          {t("saveError")}
        </p>
      )}
      {state.ok && (
        <p className="rounded-lg bg-success-surface px-3 py-2 text-sm text-success">
          {tc("saved")}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-lg bg-fg px-5 py-2 text-sm font-semibold text-page transition hover:opacity-90 disabled:opacity-50"
      >
        {tc("save")}
      </button>
    </form>
  );
}
