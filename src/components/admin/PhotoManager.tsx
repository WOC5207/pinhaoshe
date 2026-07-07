"use client";

import { useTranslations } from "next-intl";
import {
  deletePhoto,
  movePhoto,
  setCoverPhoto,
  updatePhotoCredit
} from "@/app/[locale]/admin/(protected)/events/actions";

export interface AdminPhoto {
  id: string;
  thumbUrl: string;
  cosplayerCn: string;
  characterName: string;
  isCover: boolean;
}

const btnCls =
  "rounded-md border border-border-strong px-2 py-1 text-xs text-fg-muted transition hover:border-fg-faint hover:text-fg disabled:opacity-40";

export default function PhotoManager({ photos }: { photos: AdminPhoto[] }) {
  const t = useTranslations("adminEvents");
  const tc = useTranslations("common");

  if (photos.length === 0) {
    return <p className="text-sm text-fg-subtle">{t("noPhotos")}</p>;
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {photos.map((photo, i) => (
        <li
          key={photo.id}
          className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-3"
        >
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.thumbUrl}
              alt=""
              loading="lazy"
              className="aspect-[4/3] w-full rounded-lg object-cover"
            />
            {photo.isCover && (
              <span className="absolute left-2 top-2 rounded-md bg-white/90 px-2 py-0.5 text-xs font-semibold text-neutral-900">
                {t("cover")}
              </span>
            )}
          </div>

          <form action={updatePhotoCredit} className="flex flex-col gap-2">
            <input type="hidden" name="photoId" value={photo.id} />
            <label className="flex flex-col gap-1 text-xs">
              <span className="text-fg-subtle">
                {t("cosplayerCn")} <span className="text-red-400">*</span>
              </span>
              <input
                name="cosplayerCn"
                defaultValue={photo.cosplayerCn}
                required
                maxLength={200}
                className="rounded-md border border-border-strong bg-page px-2 py-1 text-xs text-fg outline-none focus:border-fg-subtle"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs">
              <span className="text-fg-subtle">{t("characterName")}</span>
              <input
                name="characterName"
                defaultValue={photo.characterName}
                maxLength={200}
                className="rounded-md border border-border-strong bg-page px-2 py-1 text-xs text-fg outline-none focus:border-fg-subtle"
              />
            </label>
            <button type="submit" className={btnCls}>
              {tc("save")}
            </button>
          </form>

          <div className="flex flex-wrap gap-2">
            <form action={movePhoto}>
              <input type="hidden" name="photoId" value={photo.id} />
              <input type="hidden" name="direction" value="up" />
              <button type="submit" disabled={i === 0} className={btnCls}>
                ← {t("moveUp")}
              </button>
            </form>
            <form action={movePhoto}>
              <input type="hidden" name="photoId" value={photo.id} />
              <input type="hidden" name="direction" value="down" />
              <button
                type="submit"
                disabled={i === photos.length - 1}
                className={btnCls}
              >
                {t("moveDown")} →
              </button>
            </form>
            {!photo.isCover && (
              <form action={setCoverPhoto}>
                <input type="hidden" name="photoId" value={photo.id} />
                <button type="submit" className={btnCls}>
                  {t("setCover")}
                </button>
              </form>
            )}
            <form
              action={deletePhoto}
              onSubmit={(e) => {
                if (!confirm(t("confirmDeletePhoto"))) e.preventDefault();
              }}
            >
              <input type="hidden" name="photoId" value={photo.id} />
              <button
                type="submit"
                className={`${btnCls} border-red-900 text-red-400 hover:border-red-700 hover:text-red-300`}
              >
                {tc("delete")}
              </button>
            </form>
          </div>
        </li>
      ))}
    </ul>
  );
}
