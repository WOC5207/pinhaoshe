import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

// Auth depends on the request cookie — never prerender admin pages.
export const dynamic = "force-dynamic";
import { isAdmin } from "@/lib/auth";
import { Link } from "@/i18n/navigation";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import ThemeToggle from "@/components/ThemeToggle";
import { getSiteSettings } from "@/lib/settings";
import { siteImageUrl } from "@/lib/images";
import { logout } from "../login/actions";

export default async function AdminLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!(await isAdmin())) redirect(`/${locale}/admin/login`);

  const t = await getTranslations();
  const settings = await getSiteSettings();
  if (!settings.setupCompleted) redirect(`/${locale}/admin/setup`);
  const logoUrl = siteImageUrl(settings.logo);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex flex-wrap items-center gap-4">
            {logoUrl && (
              <Link
                href="/"
                aria-label={t("common.backToHome")}
                className="flex shrink-0 items-center"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={logoUrl} alt="" className="h-8 w-auto" />
              </Link>
            )}
            <nav className="flex flex-wrap items-center gap-4 text-sm">
              <Link href="/admin" className="font-semibold">
                {t("admin.dashboard")}
              </Link>
              <Link
                href="/admin/events"
                className="text-fg-muted hover:text-fg"
              >
                {t("admin.events")}
              </Link>
              {settings.bookingEnabled && (
                <Link
                  href="/admin/bookings"
                  className="text-fg-muted hover:text-fg"
                >
                  {t("admin.bookings")}
                </Link>
              )}
              {settings.cosplayersEnabled && (
                <Link
                  href="/admin/cosplayers"
                  className="text-fg-muted hover:text-fg"
                >
                  {t("admin.cosplayers")}
                </Link>
              )}
              <Link
                href="/admin/settings"
                className="text-fg-muted hover:text-fg"
              >
                {t("admin.site")}
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <ThemeToggle label={t("common.toggleTheme")} />
            <form action={logout}>
              <button
                type="submit"
                className="rounded-lg border border-border-strong px-3 py-1.5 text-sm text-fg-muted hover:border-fg-faint hover:text-fg"
              >
                {t("auth.logout")}
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        {children}
      </main>
    </div>
  );
}
