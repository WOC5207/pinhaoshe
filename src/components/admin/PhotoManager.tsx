"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  deletePhoto,
  movePhoto,
  setCoverPhoto,
  updatePhotoCredits
} from "@/app/[locale]/admin/(protected)/events/actions";

export interface AdminPhotoCredit {
  cosplayerCn: string;
  characterName: string;
}

export interface AdminPhoto {
  id: string;
  thumbUrl: string;
  credits: AdminPhotoCredit[];
  isCover: boolean;
}

const btnCls =
  "rounded-md border border-border-strong px-2 py-1 text-xs text-fg-muted transition hover:border-fg-faint hover:text-fg disabled:opacity-40";
const smallInputCls =
  "min-w-0 flex-1 rounded-md border border-border-strong bg-page px-2 py-1 text-xs text-fg outline-none focus:border-fg-subtle";

let rowKeySeq = 0;
function makeRow(initial?: AdminPhotoCredit) {
  return {
    key: rowKeySeq++,
    cosplayerCn: initial?.cosplayerCn ?? "",
    characterName: initial?.characterName ?? ""
  };
}

function CreditRowsFields({ initial }: { initial: AdminPhotoCredit[] }) {
  const t = useTranslations("adminEvents");
  const [rows, setRows] = useState(() =>
    initial.length > 0 ? initial.map((c) => makeRow(c)) : [makeRow()]
  );

  return (
    <div className="flex flex-col gap-2">
      {rows.map((row) => (
        <div key={row.key} className="flex gap-1">
          <input
            name="cosplayerCn"
            defaultValue={row.cosplayerCn}
            placeholder={t("cosplayerCn")}
            maxLength={200}
            className={smallInputCls}
          />
          <input
            name="characterName"
            defaultValue={row.characterName}
            placeholder={t("characterName")}
            maxLength={200}
            className={smallInputCls}
          />
          {rows.length > 1 && (
            <button
              type="button"
              aria-label={t("removeCosplayerAria")}
              onClick={() => setRows((r) => r.filter((x) => x.key !== row.key))}
              className={btnCls}
            >
              ×
            </button>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={() => setRows((r) => [...r, makeRow()])}
        className={`${btnCls} self-start`}
      >
        + {t("addCosplayer")}
      </button>
    </div>
  );
}

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

          <form action={updatePhotoCredits} className="flex flex-col gap-2">
            <input type="hidden" name="photoId" value={photo.id} />
            <CreditRowsFields initial={photo.credits} />
            <button type="submit" className={`${btnCls} self-start`}>
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
