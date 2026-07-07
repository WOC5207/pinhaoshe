"use client";

import { useLocale } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { routing, type AppLocale } from "@/i18n/routing";

const LABELS: Record<AppLocale, string> = {
  zh: "中文",
  en: "EN"
};

export default function LanguageSwitcher() {
  const pathname = usePathname();
  const current = useLocale();

  return (
    <span className="inline-flex items-center gap-1 text-sm">
      {routing.locales.map((locale, i) => (
        <span key={locale} className="inline-flex items-center gap-1">
          {i > 0 && <span className="text-fg-faint">/</span>}
          <Link
            href={pathname}
            locale={locale}
            className={
              locale === current
                ? "font-semibold text-fg"
                : "text-fg-subtle hover:text-fg"
            }
          >
            {LABELS[locale]}
          </Link>
        </span>
      ))}
    </span>
  );
}
