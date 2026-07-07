import { createReadStream, promises as fs } from "fs";
import path from "path";
import { Readable } from "stream";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/auth";
import { eventDir } from "@/lib/images";

const FILE_PATTERN = /^([a-z0-9]+)-(thumb|med|full|orig)\.(webp|jpg|jpeg|png)$/;

const CONTENT_TYPES: Record<string, string> = {
  webp: "image/webp",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png"
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ eventId: string; file: string }> }
) {
  const { eventId, file } = await params;

  // Strict pattern check doubles as path-traversal protection.
  const match = FILE_PATTERN.exec(file);
  if (!match || !/^[a-z0-9]+$/.test(eventId)) {
    return new NextResponse("Not found", { status: 404 });
  }
  const [, photoId, variant, ext] = match;

  const photo = await prisma.photo.findUnique({
    where: { id: photoId },
    include: { event: { select: { id: true, published: true } } }
  });
  if (!photo || photo.event.id !== eventId) {
    return new NextResponse("Not found", { status: 404 });
  }

  // Originals are admin-only; web sizes of unpublished events are admin-only.
  if (variant === "orig" || !photo.event.published) {
    if (!(await isAdmin())) return new NextResponse("Not found", { status: 404 });
  }

  const filePath = path.join(eventDir(eventId), file);
  let stat;
  try {
    stat = await fs.stat(filePath);
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }

  const stream = Readable.toWeb(
    createReadStream(filePath)
  ) as ReadableStream<Uint8Array>;

  return new NextResponse(stream, {
    headers: {
      "Content-Type": CONTENT_TYPES[ext] ?? "application/octet-stream",
      "Content-Length": String(stat.size),
      // Filenames are unique per photo, so long immutable caching is safe.
      "Cache-Control": "public, max-age=31536000, immutable"
    }
  });
}
