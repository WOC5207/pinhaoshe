import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/auth";
import { config } from "@/lib/config";
import { SITE_SETTINGS_ID } from "@/lib/settings";
import {
  ALLOWED_UPLOAD_TYPES,
  processAndStoreSiteImage,
  deleteSiteImageFile,
  siteImageUrl,
  type SiteImageOptions
} from "@/lib/images";

// Per-kind processing + which settings column the token is stored in.
const KINDS: Record<"background" | "logo", SiteImageOptions> = {
  background: { prefix: "bg", maxWidth: 2560, maxHeight: 2560, quality: 82 },
  logo: { prefix: "logo", maxWidth: 512, maxHeight: 512, quality: 90 }
};

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const form = await req.formData();
  const kind = form.get("kind");
  const file = form.get("file");

  if (kind !== "background" && kind !== "logo") {
    return NextResponse.json({ error: "badRequest" }, { status: 400 });
  }
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "badRequest" }, { status: 400 });
  }
  if (!ALLOWED_UPLOAD_TYPES[file.type]) {
    return NextResponse.json({ error: "unsupportedType" }, { status: 415 });
  }
  if (file.size > config.uploadMaxBytes()) {
    return NextResponse.json({ error: "tooLarge" }, { status: 413 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  let token: string;
  try {
    token = await processAndStoreSiteImage(buffer, KINDS[kind]);
  } catch {
    return NextResponse.json({ error: "invalidImage" }, { status: 400 });
  }

  const previous = await prisma.siteSettings.findUnique({
    where: { id: SITE_SETTINGS_ID },
    select: { backgroundImage: true, logo: true }
  });
  const previousToken =
    kind === "background" ? previous?.backgroundImage : previous?.logo;

  const next =
    kind === "background" ? { backgroundImage: token } : { logo: token };
  await prisma.siteSettings.upsert({
    where: { id: SITE_SETTINGS_ID },
    create: { id: SITE_SETTINGS_ID, ...next },
    update: next
  });

  // Remove the file the token replaced (best-effort).
  if (previousToken) await deleteSiteImageFile(previousToken);

  return NextResponse.json({ token, url: siteImageUrl(token) });
}
