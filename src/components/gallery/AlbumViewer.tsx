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
  socialLinks: { label: string; url: string }[];
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
      {/*
        Justified "poster" mosaic: each item's flex-basis and flex-grow are
        proportional to the photo's aspect ratio, so rows fill the full width
        edge-to-edge and all photos in a row share one height (varying row to
        row → varied, packed sizes). The item box ends up at the photo's own
        aspect ratio, so object-cover has essentially nothing to crop.
      */}
      <ul className="flex flex-wrap gap-1 [--row-h:150px] sm:[--row-h:210px] lg:[--row-h:250px]">
        {photos.map((photo, i) => {
          const ar = photo.height ? photo.width / photo.height : 1;
          return (
            <li
              key={photo.id}
              className="overflow-hidden rounded-md"
              style={{ flexGrow: ar, flexBasis: `calc(${ar} * var(--row-h))` }}
            >
              <button
                type="button"
                onClick={() => setOpenIndex(i)}
                className="group relative block h-full w-full cursor-zoom-in"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.thumb}
                  srcSet={`${photo.thumb} 480w, ${photo.med} 1280w`}
                  sizes="(max-width: 640px) 50vw, 33vw"
                  alt={photo.caption}
                  loading="lazy"
                  className="block h-full w-full object-cover transition group-hover:opacity-90"
                />
                <PhotoCreditOverlay credit={photo.caption} />
              </button>
            </li>
          );
        })}
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

      {/* Information bar: credit line, social buttons, camera/lens, shooting data. */}
      {(photo.caption || gearLine || shootLine || photo.socialLinks.length > 0) && (
        <div
          className="relative z-10 flex flex-col items-center gap-2 bg-black/30 px-4 pb-6 pt-3 backdrop-blur-sm"
          onClick={(e) => e.stopPropagation()}
        >
          {photo.caption && (
            <p className="text-center text-sm font-medium text-neutral-100">
              {photo.caption}
            </p>
          )}
          {photo.socialLinks.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-2">
              {photo.socialLinks.map((link, i) => (
                <a
                  key={i}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full bg-white/10 px-3 py-1.5 text-xs text-white transition hover:bg-white/20"
                >
                  {link.label} ↗
                </a>
              ))}
            </div>
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
