import { formatDate } from "@/lib/datetime";

/** "50mm", or "" if unknown. */
export function formatFocalLength(mm: number | null): string {
  return mm ? `${Math.round(mm)}mm` : "";
}

/** "f/2.8 · 1/250s · ISO 400" (only the parts that are known). */
export function formatExposure(
  aperture: number | null,
  exposureTime: number | null,
  iso: number | null
): string {
  const parts: string[] = [];
  if (aperture) parts.push(`f/${aperture}`);
  if (exposureTime) parts.push(formatShutterSpeed(exposureTime));
  if (iso) parts.push(`ISO ${iso}`);
  return parts.join(" · ");
}

function formatShutterSpeed(seconds: number): string {
  if (seconds >= 1) return `${seconds}s`;
  return `1/${Math.round(1 / seconds)}s`;
}

/** "Canon EOS R5 · RF50mm F1.2L", or just whichever of the two is known. */
export function formatGear(
  cameraModel: string | null,
  lensModel: string | null
): string {
  return [cameraModel, lensModel].filter(Boolean).join(" · ");
}

export interface PhotoExifDisplay {
  gear: string;
  focalLength: string;
  exposure: string;
  date: string;
}

/** Precompute the display strings for a photo's stored EXIF fields. */
export function formatPhotoExif(exif: {
  exifFocalLengthMm: number | null;
  exifAperture: number | null;
  exifExposureTime: number | null;
  exifIso: number | null;
  exifTakenAt: Date | null;
  exifCameraModel: string | null;
  exifLensModel: string | null;
}): PhotoExifDisplay {
  return {
    gear: formatGear(exif.exifCameraModel, exif.exifLensModel),
    focalLength: formatFocalLength(exif.exifFocalLengthMm),
    exposure: formatExposure(
      exif.exifAperture,
      exif.exifExposureTime,
      exif.exifIso
    ),
    date: exif.exifTakenAt ? formatDate(exif.exifTakenAt) : ""
  };
}
