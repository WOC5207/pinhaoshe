import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { pickText } from "@/lib/content";
import { formatSlotRange } from "@/lib/datetime";
import ConfirmSubmit from "@/components/admin/ConfirmSubmit";
import { cancelMyBooking } from "../../book/actions";

export const dynamic = "force-dynamic";

export default async function MyBookingPage({
  params,
  searchParams
}: {
  params: Promise<{ cancelToken: string }>;
  searchParams: Promise<{ new?: string }>;
}) {
  const { cancelToken } = await params;
  const { new: isNew } = await searchParams;
  const locale = await getLocale();
  const t = await getTranslations("booking");

  if (!/^[a-z0-9]+$/.test(cancelToken)) notFound();

  const booking = await prisma.booking.findUnique({
    where: { cancelToken },
    include: { timeSlot: { include: { bookingEvent: true } } }
  });
  if (!booking) notFound();

  const event = booking.timeSlot.bookingEvent;
  const cancelled = booking.status === "cancelled";

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6 rounded-2xl border border-fg/10 bg-page/85 p-6 sm:p-8">
      <h1 className="text-2xl font-bold">{t("yourBooking")}</h1>

      {isNew && !cancelled && (
        <p className="rounded-xl border border-success-border bg-success-surface p-4 text-sm text-success">
          {t("saveLinkNotice")}
        </p>
      )}
      {cancelled && (
        <p className="rounded-xl border border-danger-border bg-danger-surface p-4 text-sm text-danger">
          {t("bookingCancelledNotice")}
        </p>
      )}

      <dl className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-5 text-sm">
        <Row label={t("eventLabel")}>
          {pickText(locale, event.titleEn, event.titleZh)}
          {event.location ? ` · ${event.location}` : ""}
        </Row>
        <Row label={t("timeLabel")}>
          <span className="font-mono">
            {formatSlotRange(booking.timeSlot.startTime, booking.timeSlot.endTime)}
          </span>
        </Row>
        <Row label={t("nameLabel")}>{booking.name}</Row>
        {booking.characterName && (
          <Row label={t("characterNameLabel")}>{booking.characterName}</Row>
        )}
        <Row label={t("statusLabel")}>
          <span className={cancelled ? "text-danger" : "text-success"}>
            {cancelled ? t("statusCancelled") : t("statusConfirmed")}
          </span>
        </Row>
      </dl>

      {!cancelled && (
        <form action={cancelMyBooking}>
          <input type="hidden" name="cancelToken" value={cancelToken} />
          <ConfirmSubmit
            label={t("cancelButton")}
            confirmText={t("confirmCancel")}
          />
        </form>
      )}
    </div>
  );
}

function Row({
  label,
  children
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
      <dt className="w-24 shrink-0 text-fg-subtle">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}
