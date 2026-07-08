"use client";

import { useLocale, useTranslations } from "next-intl";
import { SOCIAL_PLATFORMS, socialPlatformLabel } from "@/lib/social";

export interface SocialLinkValue {
  key: number;
  platform: string;
  url: string;
}

let keySeq = 0;
export function emptySocialLink(initial?: { platform: string; url: string }): SocialLinkValue {
  return {
    key: keySeq++,
    platform: initial?.platform ?? SOCIAL_PLATFORMS[0].value,
    url: initial?.url ?? ""
  };
}

const inputCls =
  "min-w-0 flex-1 rounded-md border border-border-strong bg-page px-2 py-1 text-xs text-fg outline-none focus:border-fg-subtle";
const selectCls =
  "rounded-md border border-border-strong bg-page px-2 py-1 text-xs text-fg outline-none focus:border-fg-subtle";
const btnCls =
  "rounded-md border border-border-strong px-2 py-1 text-xs text-fg-muted transition hover:border-fg-faint hover:text-fg";

/** Repeatable platform-dropdown + URL editor for a cosplayer credit's social links. */
export default function SocialLinksEditor({
  links,
  onChange
}: {
  links: SocialLinkValue[];
  onChange: (links: SocialLinkValue[]) => void;
}) {
  const locale = useLocale();
  const t = useTranslations("adminEvents");

  return (
    <div className="flex flex-col gap-1 pl-2">
      {links.map((link) => (
        <div key={link.key} className="flex gap-1">
          <select
            value={link.platform}
            onChange={(e) =>
              onChange(
                links.map((l) =>
                  l.key === link.key ? { ...l, platform: e.target.value } : l
                )
              )
            }
            className={selectCls}
          >
            {SOCIAL_PLATFORMS.map((p) => (
              <option key={p.value} value={p.value}>
                {socialPlatformLabel(locale, p.value)}
              </option>
            ))}
          </select>
          <input
            value={link.url}
            onChange={(e) =>
              onChange(
                links.map((l) =>
                  l.key === link.key ? { ...l, url: e.target.value } : l
                )
              )
            }
            placeholder={t("socialUrlPlaceholder")}
            maxLength={500}
            className={inputCls}
          />
          <button
            type="button"
            aria-label={t("removeSocialLinkAria")}
            onClick={() => onChange(links.filter((l) => l.key !== link.key))}
            className={btnCls}
          >
            ×
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...links, emptySocialLink()])}
        className={`${btnCls} self-start`}
      >
        + {t("addSocialLink")}
      </button>
    </div>
  );
}
