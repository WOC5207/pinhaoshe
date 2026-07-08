import { getTranslations, getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/db";
import { pickText, formatCredits } from "@/lib/content";
import { photoUrls } from "@/lib/images";
import { formatDate, formatDateRange } from "@/lib/datetime";
import {
  getSiteSettings,
  resolveHomeTitle,
  resolveHomeSubtitle
} from "@/lib/settings";
import EventPhotoStream, {
  type StreamEvent
} from "@/components/EventPhotoStream";
import BookingCalendar, {
  type CalendarSession
} from "@/components/BookingCalendar";
import UpcomingShows, { type QuickLinkItem } from "@/components/UpcomingShows";

// Reads site settings + published events from the DB at request time (the
// DB isn't available during the Docker build), like the other public pages.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const t = await getTranslations("home");
  const locale = await getLocale();
  const settings = await getSiteSettings();

  const heroTitle = resolveHomeTitle(settings, locale, t("title"));
  const heroSubtitle = resolveHomeSubtitle(settings, locale, t("subtitle"));

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const [events, bookingEvents, quickLinks] = await Promise.all([
    prisma.event.findMany({
      where: { published: true },
      orderBy: [{ dateStart: "desc" }, { createdAt: "desc" }],
      include: {
        photos: {
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
          include: { credits: { orderBy: { sortOrder: "asc" } } }
        }
      }
    }),
    prisma.bookingEvent.findMany({
      where: { open: true, date: { gte: today } },
      orderBy: [{ date: "asc" }, { createdAt: "asc" }],
      include: {
        slots: {
          include: {
            _count: { select: { bookings: { where: { status: "confirmed" } } } }
          }
        }
      }
    }),
    prisma.quickLink.findMany({
      where: { OR: [{ date: null }, { date: { gte: today } }] },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
    })
  ]);

  const calendarSessions: CalendarSession[] = bookingEvents.map((e) => ({
    date: formatDate(e.date),
    title: pickText(locale, e.titleEn, e.titleZh),
    token: e.token,
    remaining: e.slots.reduce(
      (n, s) => n + Math.max(0, s.capacity - s._count.bookings),
      0
    )
  }));

  const quickLinkItems: QuickLinkItem[] = quickLinks.map((q) => ({
    id: q.id,
    title: pickText(locale, q.titleEn, q.titleZh),
    url: q.url,
    date: q.date ? formatDate(q.date) : null
  }));

  const streamEvents: StreamEvent[] = events
    .filter((e) => e.photos.length > 0)
    .map((e) => ({
      slug: e.slug,
      title: pickText(locale, e.titleEn, e.titleZh),
      date: formatDateRange(e.dateStart, e.dateEnd) || null,
      location: e.location,
      photos: e.photos.map((p) => ({
        id: p.id,
        url: photoUrls(e.id, p.id).thumb,
        alt: formatCredits(p.credits),
        width: p.width,
        height: p.height
      }))
    }));

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col items-center justify-center gap-6 rounded-2xl border border-fg/10 bg-page/85 px-6 py-12 text-center sm:py-16">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          {heroTitle}
        </h1>
        <p className="max-w-xl text-lg text-fg-subtle">{heroSubtitle}</p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/gallery"
            className="rounded-full bg-fg px-6 py-3 text-sm font-semibold text-page transition hover:opacity-90"
          >
            {t("browseGallery")}
          </Link>
          <Link
            href="/booking"
            className="rounded-full border border-border-strong px-6 py-3 text-sm font-semibold text-fg-muted transition hover:border-fg-faint hover:text-fg"
          >
            {t("bookingButton")}
          </Link>
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px] lg:items-start">
        <section className="flex flex-col gap-6 rounded-2xl border border-fg/10 bg-page/85 p-6 sm:p-8">
          {streamEvents.length > 0 && (
            <>
              <h2 className="text-2xl font-bold">{t("recentWork")}</h2>
              <EventPhotoStream events={streamEvents} />
            </>
          )}
        </section>

        <aside className="order-first flex flex-col gap-6 lg:order-none">
          <BookingCalendar sessions={calendarSessions} />
          <UpcomingShows
            items={quickLinkItems}
            title={t("quickLinksTitle")}
            emptyText={t("quickLinksEmpty")}
          />
        </aside>
      </div>
    </div>
  );
}
