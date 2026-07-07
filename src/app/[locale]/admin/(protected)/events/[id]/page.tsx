import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { photoUrls } from "@/lib/images";
import { Link } from "@/i18n/navigation";
import EventForm from "@/components/admin/EventForm";
import PhotoUploader from "@/components/admin/PhotoUploader";
import PhotoManager, { type AdminPhoto } from "@/components/admin/PhotoManager";
import ConfirmSubmit from "@/components/admin/ConfirmSubmit";
import { deleteEvent, updateEvent } from "../actions";

export default async function EditEventPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations("adminEvents");
  const tc = await getTranslations("common");

  const event = await prisma.event.findUnique({
    where: { id },
    include: { photos: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] } }
  });
  if (!event) notFound();

  const photos: AdminPhoto[] = event.photos.map((p) => ({
    id: p.id,
    thumbUrl: photoUrls(event.id, p.id).thumb,
    cosplayerCn: p.cosplayerCn,
    characterName: p.characterName,
    isCover: event.coverPhotoId === p.id
  }));

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{t("editEvent")}</h1>
        <div className="flex items-center gap-3">
          {event.published && (
            <Link
              href={`/gallery/${event.slug}`}
              className="text-sm text-fg-subtle underline hover:text-fg"
            >
              {t("viewPublic")}
            </Link>
          )}
          <DeleteEventButton
            id={event.id}
            label={t("deleteEvent")}
            confirmText={t("confirmDeleteEvent")}
          />
        </div>
      </div>

      <EventForm
        action={updateEvent}
        submitLabel={tc("save")}
        initial={{
          id: event.id,
          titleEn: event.titleEn,
          titleZh: event.titleZh,
          slug: event.slug,
          date: event.date ? event.date.toISOString().slice(0, 10) : "",
          location: event.location,
          descriptionEn: event.descriptionEn,
          descriptionZh: event.descriptionZh,
          published: event.published
        }}
      />

      <section className="flex flex-col gap-4 border-t border-border pt-6">
        <h2 className="text-xl font-semibold">{t("photos")}</h2>
        <PhotoUploader eventId={event.id} />
        <PhotoManager photos={photos} />
      </section>
    </div>
  );
}

function DeleteEventButton({
  id,
  label,
  confirmText
}: {
  id: string;
  label: string;
  confirmText: string;
}) {
  return (
    <form action={deleteEvent}>
      <input type="hidden" name="id" value={id} />
      <ConfirmSubmit label={label} confirmText={confirmText} />
    </form>
  );
}
