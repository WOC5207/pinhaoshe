import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  // "zh" is Simplified Chinese (zh-Hans). Swap the order / defaultLocale
  // if the site should default to English instead.
  locales: ["zh", "en"],
  defaultLocale: "zh",
  localePrefix: "always"
});

export type AppLocale = (typeof routing.locales)[number];
