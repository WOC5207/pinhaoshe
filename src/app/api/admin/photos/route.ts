import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/auth";
import { config } from "@/lib/config";
import { ALLOWED_UPLOAD_TYPES, processAndStorePhoto } from "@/lib/images";

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const form = await req.formData();
  const eventId = form.get("eventId");
  const file = form.get("file");

  if (typeof eventId !== "string" || !(file instanceof File)) {
    return NextResponse.json({ error: "badRequest" }, { status: 400 });
  }

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) {
    return NextResponse.json({ error: "eventNotFound" }, { status: 404 });
  }

  const ext = ALLOWED_UPLOAD_TYPES[file.type];
  if (!ext) {
    return NextResponse.json({ error: "unsupportedType" }, { status: 415 });
  }
  if (file.size > config.uploadMaxBytes()) {
    return NextResponse.json({ error: "tooLarge" }, { status: 413 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  // ID doubles as the on-disk base name; must contain no dashes (the
  // serving route splits on "-").
  const photoId = randomUUID().replace(/-/g, "");

  let processed;
  try {
    processed = await processAndStorePhoto(eventId, photoId, buffer, ext);
  } catch {
    return NextResponse.json({ error: "invalidImage" }, { status: 400 });
  }

  const maxOrder = await prisma.photo.aggregate({
    where: { eventId },
    _max: { sortOrder: true }
  });

  // Parallel arrays: one (cosplayerCn, characterName) pair per credit, shared
  // across the whole batch this file was uploaded as part of. Rows with a
  // blank CN are dropped (CN is the only required part of a credit).
  const cns = form.getAll("cosplayerCn").map(String);
  const chars = form.getAll("characterName").map(String);
  const credits = cns
    .map((cn, i) => ({
      cosplayerCn: cn.trim().slice(0, 200),
      characterName: (chars[i] ?? "").trim().slice(0, 200)
    }))
    .filter((c) => c.cosplayerCn.length > 0);

  const photo = await prisma.photo.create({
    data: {
      id: photoId,
      eventId,
      filename: processed.origFilename,
      originalName: file.name.slice(0, 300),
      width: processed.width,
      height: processed.height,
      sortOrder: (maxOrder._max.sortOrder ?? 0) + 1,
      exifFocalLengthMm: processed.exif.focalLengthMm,
      exifAperture: processed.exif.aperture,
      exifExposureTime: processed.exif.exposureTime,
      exifIso: processed.exif.iso,
      exifTakenAt: processed.exif.takenAt,
      exifCameraModel: processed.exif.cameraModel,
      exifLensModel: processed.exif.lensModel,
      credits: {
        create: credits.map((c, i) => ({
          cosplayerCn: c.cosplayerCn,
          characterName: c.characterName,
          sortOrder: i
        }))
      }
    }
  });

  return NextResponse.json({ id: photo.id });
}
