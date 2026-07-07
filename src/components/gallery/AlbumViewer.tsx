"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import PhotoCreditOverlay from "@/components/PhotoCreditOverlay";
import type { PhotoExifDisplay } from "@/lib/exif";

export interface AlbumPhoto {
  id: string;
  thumb: string;
  med: string;
  full: string;
  caption: string;
  width: number;
  height: number;
  exif: PhotoExifDisplay;
}

export interface LightboxLabels {
  close: string;
  previous: string;
  next: string;
}

export default function AlbumViewer({
  photos,
  labels
}: {
  photos: AlbumPhoto[];
  labels: LightboxLabels;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <>
      {/* Masonry-style responsive grid, lazy-loaded thumbnails */}
      <ul className="columns-2 gap-3 sm:columns-3 lg:columns-4 [&>li]:mb-3">
        {photos.map((photo, i) => (
          <li key={photo.id} className="break-inside-avoid">
            <button
              type="button"
              onClick={() => setOpenIndex(i)}
              className="group relative block w-full overflow-hidden rounded-lg cursor-zoom-in"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.thumb}
                srcSet={`${photo.thumb} 480w, ${photo.med} 1280w`}
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                alt={photo.caption}
                loading="lazy"
                width={photo.width}
                height={photo.height}
                className="w-full transition group-hover:opacity-90"
              />
              <PhotoCreditOverlay credit={photo.caption} />
            </button>
          </li>
        ))}
      </ul>

      {openIndex !== null && (
        <Lightbox
          photos={photos}
          index={openIndex}
          labels={labels}
          onNavigate={setOpenIndex}
          onClose={() => setOpenIndex(null)}
        />
      )}
    </>
  );
}

function Lightbox({
  photos,
  index,
  labels,
  onNavigate,
  onClose
}: {
  photos: AlbumPhoto[];
  index: number;
  labels: LightboxLabels;
  onNavigate: (i: number) => void;
  onClose: () => void;
}) {
  const photo = photos[index];
  const touchStartX = useRef<number | null>(null);

  const prev = useCallback(
    () => onNavigate(index > 0 ? index - 1 : photos.length - 1),
    [index, photos.length, onNavigate]
  );
  const next = useCallback(
    () => onNavigate(index < photos.length - 1 ? index + 1 : 0),
    [index, photos.length, onNavigate]
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
    }
    window.addEventListener("keydown", onKey);
    // Lock body scroll while open
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [prev, next, onClose]);

  const shootLine = [photo.exif.focalLength, photo.exif.exposure, photo.exif.date]
    .filter(Boolean)
    .join(" · ");
  const gearLine = photo.exif.gear;

  // Rendered via a portal straight into <body>: the page's <main> panel has
  // a backdrop-blur (for its "liquid glass" look), and any ancestor with
  // backdrop-filter/filter/transform creates a new containing block for
  // fixed-position descendants — which would size/position this modal
  // relative to that panel instead of the actual viewport.
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-black"
      onClick={onClose}
      onTouchStart={(e) => {
        touchStartX.current = e.touches[0].clientX;
      }}
      onTouchEnd={(e) => {
        if (touchStartX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchStartX.current;
        touchStartX.current = null;
        if (Math.abs(dx) > 60) (dx > 0 ? prev : next)();
      }}
    >
      {/* Ambient backdrop: the same photo, heavily blurred and darkened, in
          place of a flat black background/border around the enlarged photo. */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${photo.med})`,
          backgroundSize: "cover",
          backgroundPosition: "center"
        }}
      />
      <div aria-hidden className="absolute inset-0 bg-black/55 backdrop-blur-2xl" />

      <div className="relative z-10 flex items-center justify-between bg-black/30 p-4 backdrop-blur-sm">
        <span className="text-sm text-neutral-300">
          {index + 1} / {photos.length}
        </span>
        <button
          type="button"
          aria-label={labels.close}
          onClick={onClose}
          className="rounded-full bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20"
        >
          ✕
        </button>
      </div>

      <div className="relative z-10 flex flex-1 items-center justify-center overflow-hidden px-2 pb-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={photo.id}
          src={photo.med}
          srcSet={`${photo.med} 1280w, ${photo.full} 2560w`}
          sizes="100vw"
          alt={photo.caption}
          onClick={(e) => e.stopPropagation()}
          className="max-h-full max-w-full rounded-md object-contain shadow-2xl"
        />

        <button
          type="button"
          aria-label={labels.previous}
          onClick={(e) => {
            e.stopPropagation();
            prev();
          }}
          className="absolute left-2 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/10 px-4 py-3 text-white hover:bg-white/20 sm:block"
        >
          ‹
        </button>
        <button
          type="button"
          aria-label={labels.next}
          onClick={(e) => {
            e.stopPropagation();
            next();
          }}
          className="absolute right-2 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/10 px-4 py-3 text-white hover:bg-white/20 sm:block"
        >
          ›
        </button>
      </div>

      {/* Information bar: credit line, then camera/lens, then shooting data. */}
      {(photo.caption || gearLine || shootLine) && (
        <div
          className="relative z-10 flex flex-col items-center gap-1 bg-black/30 px-4 pb-6 pt-3 backdrop-blur-sm"
          onClick={(e) => e.stopPropagation()}
        >
          {photo.caption && (
            <p className="text-center text-sm font-medium text-neutral-100">
              {photo.caption}
            </p>
          )}
          {gearLine && (
            <p className="text-center text-xs text-neutral-400">{gearLine}</p>
          )}
          {shootLine && (
            <p className="text-center text-xs text-neutral-400">{shootLine}</p>
          )}
        </div>
      )}
    </div>,
    document.body
  );
}
