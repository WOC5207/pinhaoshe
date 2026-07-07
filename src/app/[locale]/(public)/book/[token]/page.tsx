import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { pickText } from "@/lib/content";
import { formatDate } from "@/lib/datetime";
import BookingForm, { type PublicSlot } from "@/components/booking/BookingForm";

export const dynamic = "force-dynamic";

export default async function BookPage({
  params
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const locale = await getLocale();
  const t = await getTranslations("booking");

  if (!/^[a-z0-9]+$/.test(token)) notFound();

  const event = await prisma.bookingEvent.findUnique({
    where: { token },
    include: {
      slots: {
        orderBy: { startTime: "asc" },
        include: {
          _count: {
            select: { bookings: { where: { status: "confirmed" } } }
          }
        }
      }
    }
  });
  if (!event) notFound();

  const slots: PublicSlot[] = event.slots.map((s) => ({
    id: s.id,
    start: s.startTime.toISOString(),
    end: s.endTime.toISOString(),
    remaining: Math.max(0, s.capacity - s._count.bookings)
  }));

  const description = pickText(locale, event.descriptionEn, event.descriptionZh);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 rounded-2xl border border-fg/10 bg-page/85 p-6 sm:p-8">
      <div>
        <h1 className="text-3xl font-bold">
          {pickText(locale, event.titleEn, event.titleZh)}
        </h1>
        <p className="mt-1 text-sm text-fg-subtle">
          {[formatDate(event.date), event.location || null]
            .filter(Boolean)
            .join(" · ")}
        </p>
        {description && (
          <p className="mt-3 whitespace-pre-line text-fg-muted">
            {description}
          </p>
        )}
      </div>

      {!event.open ? (
        <p className="rounded-xl border border-border bg-surface p-6 text-center text-fg-subtle">
          {t("closedNotice")}
        </p>
      ) : slots.length === 0 ? (
        <p className="rounded-xl border border-border bg-surface p-6 text-center text-fg-subtle">
          {t("noSlotsNotice")}
        </p>
      ) : (
        <BookingForm slots={slots} />
      )}
    </div>
  );
}
