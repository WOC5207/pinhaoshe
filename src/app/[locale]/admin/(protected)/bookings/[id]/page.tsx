import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { config } from "@/lib/config";
import { formatSlotRange, formatDateTime } from "@/lib/datetime";
import BookingEventForm from "@/components/admin/BookingEventForm";
import SlotAdder from "@/components/admin/SlotAdder";
import ConfirmSubmit from "@/components/admin/ConfirmSubmit";
import CopyButton from "@/components/admin/CopyButton";
import BookingStatusButton from "@/components/admin/BookingStatusButton";
import {
  deleteBookingEvent,
  deleteSlot,
  updateBookingEvent
} from "../actions";

export default async function EditBookingEventPage({
  params
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id, locale } = await params;
  const t = await getTranslations("adminBookings");
  const tc = await getTranslations("common");

  const event = await prisma.bookingEvent.findUnique({
    where: { id },
    include: {
      slots: {
        orderBy: { startTime: "asc" },
        include: {
          bookings: { orderBy: { createdAt: "asc" } }
        }
      }
    }
  });
  if (!event) notFound();

  const shareUrl = `${config.appBaseUrl()}/${locale}/book/${event.token}`;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{t("editEvent")}</h1>
        <form action={deleteBookingEvent}>
          <input type="hidden" name="id" value={event.id} />
          <ConfirmSubmit
            label={t("deleteEvent")}
            confirmText={t("confirmDeleteEvent")}
          />
        </form>
      </div>

      <div className="rounded-xl border border-border bg-surface p-4">
        <p className="text-sm font-semibold">{t("shareLink")}</p>
        <div className="mt-2 flex items-center gap-2">
          <code className="break-all rounded-md bg-page px-3 py-2 text-xs text-emerald-300">
            {shareUrl}
          </code>
          <CopyButton text={shareUrl} />
        </div>
        <p className="mt-2 text-xs text-fg-subtle">{t("shareLinkHint")}</p>
      </div>

      <BookingEventForm
        action={updateBookingEvent}
        submitLabel={tc("save")}
        initial={{
          id: event.id,
          titleEn: event.titleEn,
          titleZh: event.titleZh,
          date: event.date.toISOString().slice(0, 10),
          location: event.location,
          descriptionEn: event.descriptionEn,
          descriptionZh: event.descriptionZh,
          open: event.open
        }}
      />

      <section className="flex flex-col gap-4 border-t border-border pt-6">
        <h2 className="text-xl font-semibold">{t("slots")}</h2>

        {event.slots.length === 0 ? (
          <p className="text-sm text-fg-subtle">{t("noSlots")}</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {event.slots.map((slot) => {
              const confirmed = slot.bookings.filter(
                (b) => b.status === "confirmed"
              );
              return (
                <li
                  key={slot.id}
                  className="rounded-xl border border-border bg-surface p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-mono text-sm font-semibold">
                      {formatSlotRange(slot.startTime, slot.endTime)}
                      <span className="ml-3 font-sans font-normal text-fg-subtle">
                        {t("booked", {
                          booked: confirmed.length,
                          capacity: slot.capacity
                        })}
                      </span>
                    </p>
                    <form action={deleteSlot}>
                      <input type="hidden" name="slotId" value={slot.id} />
                      <ConfirmSubmit
                        label={t("deleteSlot")}
                        confirmText={t("confirmDeleteSlot")}
                      />
                    </form>
                  </div>

                  {slot.bookings.length > 0 && (
                    <ul className="mt-3 flex flex-col gap-2 border-t border-border pt-3">
                      {slot.bookings.map((b) => (
                        <li
                          key={b.id}
                          className="flex flex-wrap items-center justify-between gap-2 text-sm"
                        >
                          <div
                            className={
                              b.status === "cancelled"
                                ? "text-fg-faint line-through"
                                : ""
                            }
                          >
                            <span className="font-semibold">{b.name}</span>
                            <span className="ml-2 text-fg-subtle">
                              {[b.email, b.phone].filter(Boolean).join(" · ")}
                            </span>
                            {b.notes && (
                              <p className="mt-0.5 max-w-xl whitespace-pre-line text-xs text-fg-subtle">
                                {b.notes}
                              </p>
                            )}
                            <p className="text-xs text-fg-subtle">
                              {t("bookedAt")}: {formatDateTime(b.createdAt)}
                            </p>
                          </div>
                          <BookingStatusButton
                            bookingId={b.id}
                            status={b.status}
                          />
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        <SlotAdder eventId={event.id} />
      </section>
    </div>
  );
}
