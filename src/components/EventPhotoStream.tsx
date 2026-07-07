import { Link } from "@/i18n/navigation";
import PhotoCreditOverlay from "@/components/PhotoCreditOverlay";

export interface StreamPhoto {
  id: string;
  url: string;
  alt: string;
  width: number;
  height: number;
}

export interface StreamEvent {
  slug: string;
  title: string;
  date: string | null;
  location: string;
  photos: StreamPhoto[];
}

/**
 * The homepage's scroll-down photo stream: every published album with
 * photos, each as its own labeled section (title/date/location) followed by
 * a masonry of that album's photos — the same photos you'd see on the album
 * page, just all inline so visitors can browse without clicking in. Uses a
 * CSS-columns masonry (like AlbumViewer's grid) so photos keep their natural
 * aspect ratio instead of being cropped into uniform tiles.
 */
export default function EventPhotoStream({
  events
}: {
  events: StreamEvent[];
}) {
  if (events.length === 0) return null;

  return (
    <div className="flex flex-col gap-10">
      {events.map((event) => (
        <section key={event.slug} className="flex flex-col gap-3">
          <Link
            href={`/gallery/${event.slug}`}
            className="group flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1"
          >
            <h3 className="text-xl font-semibold group-hover:underline">
              {event.title}
            </h3>
            <span className="text-sm text-fg-subtle">
              {[event.date, event.location || null].filter(Boolean).join(" · ")}
            </span>
          </Link>
          <ul className="columns-2 gap-3 sm:columns-3 lg:columns-4 [&>li]:mb-3">
            {event.photos.map((photo) => {
              // On mobile, a photo squeezed into one of two columns can get
              // too small to read. Landscape photos span the full stream
              // width there instead of sitting in a column; tablet/desktop
              // are unaffected.
              const isLandscape = photo.width > photo.height;
              return (
                <li
                  key={photo.id}
                  className={
                    isLandscape
                      ? "break-inside-avoid [column-span:all] sm:[column-span:none]"
                      : "break-inside-avoid"
                  }
                >
                  <Link
                    href={`/gallery/${event.slug}`}
                    className="group relative block overflow-hidden rounded-lg"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.url}
                      alt={photo.alt}
                      loading="lazy"
                      width={photo.width}
                      height={photo.height}
                      className="w-full transition group-hover:opacity-90"
                    />
                    <PhotoCreditOverlay credit={photo.alt} />
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
