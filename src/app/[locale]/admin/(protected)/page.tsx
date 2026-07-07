import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function AdminDashboardPage() {
  const t = await getTranslations("admin");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">{t("dashboard")}</h1>
        <p className="mt-1 text-fg-subtle">{t("welcome")}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/admin/events"
          className="rounded-xl border border-border bg-surface p-6 transition hover:border-border-strong"
        >
          <h2 className="text-lg font-semibold">{t("events")}</h2>
          <p className="mt-1 text-sm text-fg-subtle">
            {t("eventsCardHint")}
          </p>
        </Link>
        <Link
          href="/admin/bookings"
          className="rounded-xl border border-border bg-surface p-6 transition hover:border-border-strong"
        >
          <h2 className="text-lg font-semibold">{t("bookings")}</h2>
          <p className="mt-1 text-sm text-fg-subtle">
            {t("bookingsCardHint")}
          </p>
        </Link>
        <Link
          href="/admin/settings"
          className="rounded-xl border border-border bg-surface p-6 transition hover:border-border-strong"
        >
          <h2 className="text-lg font-semibold">{t("site")}</h2>
          <p className="mt-1 text-sm text-fg-subtle">{t("siteCardHint")}</p>
        </Link>
      </div>
    </div>
  );
}
