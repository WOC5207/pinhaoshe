import "server-only";
import path from "path";
import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import sharp from "sharp";
import exifr from "exifr";
import { config } from "./config";

// Keep sharp's appetite modest on NAS hardware.
sharp.concurrency(2);
sharp.cache(false);

export const ALLOWED_UPLOAD_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp"
};

// Generated web sizes. sharp strips ALL metadata (EXIF/GPS/etc.) by default
// on output, which is exactly what we want for displayed images.
const SIZES = [
  { suffix: "thumb", width: 480, quality: 70 },
  { suffix: "med", width: 1280, quality: 80 },
  { suffix: "full", width: 2560, quality: 85 }
] as const;

export function eventDir(eventId: string): string {
  return path.join(config.photosDir(), eventId);
}

export interface ProcessedUpload {
  width: number;
  height: number;
  origFilename: string;
  exif: PhotoExif;
}

export interface PhotoExif {
  focalLengthMm: number | null;
  aperture: number | null;
  exposureTime: number | null;
  iso: number | null;
  takenAt: Date | null;
  cameraModel: string | null;
  lensModel: string | null;
}

/**
 * Read the shooting EXIF from the as-uploaded buffer, before any of our own
 * processing strips it. Best-effort: missing/unparseable EXIF just means
 * every field comes back null (e.g. screenshots, graphics, edited exports).
 */
async function extractExif(buffer: Buffer): Promise<PhotoExif> {
  const empty: PhotoExif = {
    focalLengthMm: null,
    aperture: null,
    exposureTime: null,
    iso: null,
    takenAt: null,
    cameraModel: null,
    lensModel: null
  };
  const tags = await exifr
    .parse(buffer, {
      pick: [
        "FocalLength",
        "FNumber",
        "ExposureTime",
        "ISO",
        "DateTimeOriginal",
        "Make",
        "Model",
        "LensModel"
      ]
    })
    .catch(() => null);
  if (!tags) return empty;

  const make = typeof tags.Make === "string" ? tags.Make.trim() : "";
  const model = typeof tags.Model === "string" ? tags.Model.trim() : "";
  // Many bodies repeat the make as a prefix of the model (e.g. "Canon" /
  // "Canon EOS R5"); avoid showing it twice.
  const cameraModel =
    model && (!make || model.toLowerCase().startsWith(make.toLowerCase()))
      ? model || null
      : [make, model].filter(Boolean).join(" ") || null;

  return {
    focalLengthMm: typeof tags.FocalLength === "number" ? tags.FocalLength : null,
    aperture: typeof tags.FNumber === "number" ? tags.FNumber : null,
    exposureTime:
      typeof tags.ExposureTime === "number" ? tags.ExposureTime : null,
    iso: typeof tags.ISO === "number" ? tags.ISO : null,
    takenAt: tags.DateTimeOriginal instanceof Date ? tags.DateTimeOriginal : null,
    cameraModel,
    lensModel: typeof tags.LensModel === "string" ? tags.LensModel.trim() || null : null
  };
}

/**
 * Writes the original plus thumb/med/full webp renditions for a photo.
 * Returns the display dimensions (after EXIF orientation is applied) and the
 * shooting EXIF read from the original before it's stripped.
 */
export async function processAndStorePhoto(
  eventId: string,
  photoId: string,
  buffer: Buffer,
  ext: string
): Promise<ProcessedUpload> {
  const dir = eventDir(eventId);
  await fs.mkdir(dir, { recursive: true });

  const meta = await sharp(buffer).metadata();
  if (!meta.width || !meta.height) throw new Error("Unreadable image");
  const swapped = (meta.orientation ?? 1) >= 5;
  const width = swapped ? meta.height : meta.width;
  const height = swapped ? meta.width : meta.height;
  const exif = await extractExif(buffer);

  // Sequential to keep peak memory low.
  for (const size of SIZES) {
    await sharp(buffer, { failOn: "none" })
      .rotate() // apply EXIF orientation before metadata is stripped
      .resize({ width: size.width, withoutEnlargement: true })
      .webp({ quality: size.quality })
      .toFile(path.join(dir, `${photoId}-${size.suffix}.webp`));
  }

  const origFilename = `${photoId}-orig.${ext}`;
  const origPath = path.join(dir, origFilename);
  if (config.stripOriginalExif()) {
    // Re-encode (high quality) to drop EXIF from the stored original too.
    const pipeline = sharp(buffer, { failOn: "none" }).rotate();
    if (ext === "png") await pipeline.png().toFile(origPath);
    else if (ext === "webp")
      await pipeline.webp({ quality: 95 }).toFile(origPath);
    else await pipeline.jpeg({ quality: 95, mozjpeg: true }).toFile(origPath);
  } else {
    await fs.writeFile(origPath, buffer);
  }

  return { width, height, origFilename, exif };
}

export async function deletePhotoFiles(
  eventId: string,
  photoId: string,
  origFilename: string
): Promise<void> {
  const dir = eventDir(eventId);
  const files = [
    origFilename,
    ...SIZES.map((s) => `${photoId}-${s.suffix}.webp`)
  ];
  await Promise.all(
    files.map((f) => fs.rm(path.join(dir, f), { force: true }))
  );
}

export async function deleteEventFiles(eventId: string): Promise<void> {
  await fs.rm(eventDir(eventId), { recursive: true, force: true });
}

export function photoUrls(eventId: string, photoId: string) {
  const base = `/api/images/${eventId}/${photoId}`;
  return {
    thumb: `${base}-thumb.webp`,
    med: `${base}-med.webp`,
    full: `${base}-full.webp`
  };
}

// --- Site-level images (background, logo) -------------------------------
// These are not tied to a gallery event; they live under a "_site" folder
// (the leading underscore keeps them out of the event-image route, whose
// eventId must match /^[a-z0-9]+$/).

export function siteDir(): string {
  return path.join(config.photosDir(), "_site");
}

export interface SiteImageOptions {
  // Filename prefix (also part of the served URL token), e.g. "bg" or "logo".
  prefix: string;
  maxWidth: number;
  maxHeight: number;
  quality: number;
}

/**
 * Store an uploaded site image (background, logo, …) as a single webp with all
 * metadata stripped. Returns a fresh token; the file is
 * <PHOTOS_DIR>/_site/<token>.webp. A new token per upload lets the served URL
 * be cached immutably.
 */
export async function processAndStoreSiteImage(
  buffer: Buffer,
  opts: SiteImageOptions
): Promise<string> {
  const dir = siteDir();
  await fs.mkdir(dir, { recursive: true });

  const meta = await sharp(buffer).metadata();
  if (!meta.width || !meta.height) throw new Error("Unreadable image");

  const token = `${opts.prefix}${randomUUID().replace(/-/g, "")}`;
  await sharp(buffer, { failOn: "none" })
    .rotate()
    .resize({
      width: opts.maxWidth,
      height: opts.maxHeight,
      fit: "inside",
      withoutEnlargement: true
    })
    .webp({ quality: opts.quality })
    .toFile(path.join(dir, `${token}.webp`));
  return token;
}

export async function deleteSiteImageFile(token: string): Promise<void> {
  if (!token) return;
  await fs.rm(path.join(siteDir(), `${token}.webp`), { force: true });
}

export function siteImageUrl(token: string): string {
  return token ? `/api/site/${token}.webp` : "";
}
