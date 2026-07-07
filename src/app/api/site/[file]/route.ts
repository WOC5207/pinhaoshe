import { createReadStream, promises as fs } from "fs";
import path from "path";
import { Readable } from "stream";
import { NextRequest, NextResponse } from "next/server";
import { siteDir } from "@/lib/images";

// Only tokenised webp names; also serves as path-traversal protection.
const FILE_PATTERN = /^[a-z0-9]+\.webp$/;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ file: string }> }
) {
  const { file } = await params;
  if (!FILE_PATTERN.test(file)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const filePath = path.join(siteDir(), file);
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
      "Content-Type": "image/webp",
      "Content-Length": String(stat.size),
      // The token changes on every upload, so caching immutably is safe.
      "Cache-Control": "public, max-age=31536000, immutable"
    }
  });
}
