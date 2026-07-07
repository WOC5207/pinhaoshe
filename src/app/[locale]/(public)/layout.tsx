import type { CSSProperties } from "react";
import { getTranslations, getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import MobileNav from "@/components/MobileNav";
import ThemeToggle from "@/components/ThemeToggle";
import ScrollBlurBackground from "@/components/ScrollBlurBackground";
import { getSiteSettings, resolveSiteTitle } from "@/lib/settings";
import { siteImageUrl } from "@/lib/images";

export default async function PublicLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const t = await getTranslations();
  const locale = await getLocale();
  const settings = await getSiteSettings();

  const siteTitle = resolveSiteTitle(settings, locale, t("common.siteName"));
  const bgImage = siteImageUrl(settings.backgroundImage);
  const logoUrl = siteImageUrl(settings.logo);

  // Admin-customizable background: a color and/or a full-page image, scoped to
  // the public site so admin screens keep their standard look. Rendered via
  // ScrollBlurBackground (a separate fixed layer) rather than inline on this
  // wrapper, so its scroll-driven blur never affects the header/main/footer
  // sitting on top of it.
  const style: CSSProperties = {};
  if (settings.backgroundColor) style.backgroundColor = settings.backgroundColor;
  if (bgImage) {
    style.backgroundImage = `url(${bgImage})`;
    style.backgroundSize = "cover";
    style.backgroundPosition = "center";
  }

  return (
    <div className="flex min-h-screen flex-col">
      <ScrollBlurBackground style={style} />
      <header className="sticky top-0 z-40 border-b border-fg/10 bg-page/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-3">
          <Link
            href="/"
            className="flex items-center gap-2 text-lg font-semibold tracking-wide"
          >
            {logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="" className="h-8 w-auto" />
            )}
            {siteTitle}
          </Link>
          <nav className="hidden items-center gap-4 text-sm sm:flex sm:gap-5">
            <Link href="/gallery" className="text-fg-muted hover:text-fg">
              {t("nav.gallery")}
            </Link>
            <Link href="/booking" className="text-fg-muted hover:text-fg">
              {t("nav.booking")}
            </Link>
            <LanguageSwitcher />
            <ThemeToggle label={t("common.toggleTheme")} />
            <Link
              href="/admin"
              className="rounded-lg border border-border-strong px-3 py-1.5 text-fg-muted transition hover:border-fg-faint hover:text-fg"
            >
              {t("nav.admin")}
            </Link>
          </nav>
          <MobileNav
            labels={{
              gallery: t("nav.gallery"),
              booking: t("nav.booking"),
              admin: t("nav.admin"),
              menu: t("nav.menu"),
              toggleTheme: t("common.toggleTheme")
            }}
          />
        </div>
      </header>
      <main className="mx-auto my-4 w-full max-w-[1600px] flex-1 px-4 sm:my-8 sm:px-6">
        {children}
      </main>
      <footer className="border-t border-fg/10 bg-page/70 py-6 text-center text-xs text-fg-subtle backdrop-blur-xl">
        © {new Date().getFullYear()} {siteTitle}
      </footer>
    </div>
  );
}
