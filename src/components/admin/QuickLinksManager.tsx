"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import {
  addQuickLink,
  deleteQuickLink,
  moveQuickLink,
  updateQuickLink,
  type QuickLinkState
} from "@/app/[locale]/admin/(protected)/settings/actions";

export interface AdminQuickLink {
  id: string;
  titleEn: string;
  titleZh: string;
  url: string;
  date: string; // yyyy-mm-dd, or "" when unset
}

const inputCls =
  "rounded-lg border border-border-strong bg-surface px-3 py-2 text-sm text-fg outline-none focus:border-fg-subtle";
const btnCls =
  "rounded-md border border-border-strong px-2 py-1 text-xs text-fg-muted transition hover:border-fg-faint hover:text-fg disabled:opacity-40";

export default function QuickLinksManager({
  links
}: {
  links: AdminQuickLink[];
}) {
  const t = useTranslations("adminSite");
  const tc = useTranslations("common");
  const [state, formAction, pending] = useActionState<QuickLinkState, FormData>(
    addQuickLink,
    {}
  );

  return (
    <section className="flex flex-col gap-3 border-t border-border pt-6">
      <h2 className="text-lg font-semibold">{t("quickLinksSection")}</h2>
      <p className="-mt-1 text-xs text-fg-subtle">{t("quickLinksHint")}</p>

      {links.length > 0 && (
        <ul className="flex flex-col gap-2">
          {links.map((link, i) => (
            <li
              key={link.id}
              className="rounded-xl border border-border bg-surface p-3"
            >
              <form
                action={updateQuickLink}
                className="grid gap-2 sm:grid-cols-[1fr_1fr_1fr_auto]"
              >
                <input type="hidden" name="id" value={link.id} />
                <input
                  name="titleEn"
                  defaultValue={link.titleEn}
                  placeholder={t("quickLinkTitleEn")}
                  maxLength={200}
                  className={inputCls}
                />
                <input
                  name="titleZh"
                  defaultValue={link.titleZh}
                  placeholder={t("quickLinkTitleZh")}
                  maxLength={200}
                  className={inputCls}
                />
                <input
                  name="url"
                  defaultValue={link.url}
                  placeholder={t("quickLinkUrl")}
                  maxLength={500}
                  className={inputCls}
                />
                <input
                  name="date"
                  type="date"
                  defaultValue={link.date}
                  aria-label={t("quickLinkDate")}
                  className={inputCls}
                />
                <button type="submit" className={`${btnCls} sm:col-span-4 sm:w-fit`}>
                  {tc("save")}
                </button>
              </form>
              <div className="mt-2 flex flex-wrap gap-2">
                <form action={moveQuickLink}>
                  <input type="hidden" name="id" value={link.id} />
                  <input type="hidden" name="direction" value="up" />
                  <button type="submit" disabled={i === 0} className={btnCls}>
                    ← {t("moveUp")}
                  </button>
                </form>
                <form action={moveQuickLink}>
                  <input type="hidden" name="id" value={link.id} />
                  <input type="hidden" name="direction" value="down" />
                  <button
                    type="submit"
                    disabled={i === links.length - 1}
                    className={btnCls}
                  >
                    {t("moveDown")} →
                  </button>
                </form>
                <form
                  action={deleteQuickLink}
                  onSubmit={(e) => {
                    if (!confirm(t("confirmDeleteQuickLink"))) e.preventDefault();
                  }}
                >
                  <input type="hidden" name="id" value={link.id} />
                  <button
                    type="submit"
                    className={`${btnCls} border-red-900 text-red-400 hover:border-red-700 hover:text-red-300`}
                  >
                    {tc("delete")}
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
      {links.length === 0 && (
        <p className="text-sm text-fg-subtle">{t("noQuickLinks")}</p>
      )}

      <form
        action={formAction}
        className="grid gap-2 rounded-xl border border-dashed border-border-strong p-3 sm:grid-cols-[1fr_1fr_1fr_auto]"
      >
        <input
          name="titleEn"
          placeholder={t("quickLinkTitleEn")}
          maxLength={200}
          className={inputCls}
        />
        <input
          name="titleZh"
          placeholder={t("quickLinkTitleZh")}
          maxLength={200}
          className={inputCls}
        />
        <input
          name="url"
          placeholder={t("quickLinkUrl")}
          maxLength={500}
          className={inputCls}
        />
        <input
          name="date"
          type="date"
          aria-label={t("quickLinkDate")}
          className={inputCls}
        />
        <button
          type="submit"
          disabled={pending}
          className={`${btnCls} sm:col-span-4 sm:w-fit`}
        >
          + {t("addQuickLink")}
        </button>
      </form>
      {state.error && (
        <p className="text-xs text-red-400">{t("quickLinkValidationError")}</p>
      )}
    </section>
  );
}
