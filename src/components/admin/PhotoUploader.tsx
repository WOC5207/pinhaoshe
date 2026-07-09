"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import SocialLinksEditor, {
  emptySocialLink,
  type SocialLinkValue
} from "./SocialLinksEditor";

export interface CosplayerProfile {
  cosplayerCn: string;
  socialLinks: { platform: string; url: string }[];
}

type UploadStatus = { total: number; done: number; failed: string[] };
type Mode = "single" | "multiple";
interface Row {
  key: number;
  cosplayerCn: string;
  characterName: string;
  socialLinks: SocialLinkValue[];
  // The CN this row's social links currently reflect (from a profile match,
  // or "" if cleared/no match) — lets us tell when the CN has moved on to a
  // different person and the links need to follow, instead of lingering
  // from whoever was typed before.
  linksSourceCn: string;
}

let rowKeySeq = 0;
function emptyRow(): Row {
  return {
    key: rowKeySeq++,
    cosplayerCn: "",
    characterName: "",
    socialLinks: [],
    linksSourceCn: ""
  };
}

const inputCls =
  "min-w-0 flex-1 rounded-lg border border-border-strong bg-surface px-3 py-2 text-sm text-fg outline-none focus:border-fg-subtle";
const modeBtnCls = (active: boolean) =>
  `rounded-md px-3 py-1.5 text-xs font-semibold transition ${
    active
      ? "bg-fg text-page"
      : "border border-border-strong text-fg-muted hover:border-fg-faint hover:text-fg"
  }`;
const btnCls =
  "rounded-md border border-border-strong px-2 py-1 text-xs text-fg-muted transition hover:border-fg-faint hover:text-fg disabled:opacity-40";

export default function PhotoUploader({
  eventId,
  cosplayers
}: {
  eventId: string;
  cosplayers: CosplayerProfile[];
}) {
  const t = useTranslations("adminEvents");
  const tc = useTranslations("common");
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [files, setFiles] = useState<File[]>([]);
  const [mode, setMode] = useState<Mode>("single");
  const [rows, setRows] = useState<Row[]>(() => [emptyRow()]);
  const [status, setStatus] = useState<UploadStatus | null>(null);
  const [busy, setBusy] = useState(false);

  const credits = rows
    .map((r) => ({
      cosplayerCn: r.cosplayerCn.trim(),
      characterName: r.characterName.trim(),
      socialLinks: r.socialLinks
        .map((s) => ({ platform: s.platform, url: s.url.trim() }))
        .filter((s) => s.url.length > 0)
    }))
    .filter((r) => r.cosplayerCn.length > 0);

  const canCreate = !busy && files.length > 0 && credits.length > 0;

  function switchMode(next: Mode) {
    setMode(next);
    setRows((rs) => {
      if (next === "single") return rs.length > 0 ? [rs[0]] : [emptyRow()];
      if (rs.length < 2) return [...rs, ...Array.from({ length: 2 - rs.length }, emptyRow)];
      return rs;
    });
  }

  function updateRow(key: number, patch: Partial<Row>) {
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  // Keep a row's social links in sync with whichever CN is currently typed
  // in it: once the admin finishes editing the CN, if it's actually changed
  // since the links were last synced, replace them with the new CN's
  // remembered profile (or clear them if there's no match) — so links never
  // linger from a CN that's since been cleared or swapped for someone else.
  function syncLinksToCn(key: number, typedCn: string) {
    const cn = typedCn.trim();
    setRows((rs) =>
      rs.map((r) => {
        if (r.key !== key || cn === r.linksSourceCn) return r;
        const profile = cosplayers.find((c) => c.cosplayerCn === cn);
        return {
          ...r,
          linksSourceCn: cn,
          socialLinks: profile ? profile.socialLinks.map((s) => emptySocialLink(s)) : []
        };
      })
    );
  }

  async function handleCreate() {
    if (!canCreate) return;
    setBusy(true);
    const failed: string[] = [];
    const total = files.length;
    setStatus({ total, done: 0, failed });

    // One at a time: keeps sharp's memory use low on the NAS.
    for (let i = 0; i < total; i++) {
      const file = files[i];
      try {
        const body = new FormData();
        body.append("eventId", eventId);
        body.append("file", file);
        body.append("credits", JSON.stringify(credits));
        const res = await fetch("/api/admin/photos", { method: "POST", body });
        if (!res.ok) failed.push(file.name);
      } catch {
        failed.push(file.name);
      }
      setStatus({ total, done: i + 1, failed: [...failed] });
    }

    setBusy(false);
    setFiles([]);
    if (inputRef.current) inputRef.current.value = "";
    setRows(mode === "single" ? [emptyRow()] : [emptyRow(), emptyRow()]);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-dashed border-border-strong p-4">
      <datalist id="known-cosplayers">
        {cosplayers.map((c) => (
          <option key={c.cosplayerCn} value={c.cosplayerCn} />
        ))}
      </datalist>
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex w-fit cursor-pointer items-center gap-2 rounded-lg border border-border-strong px-4 py-2 text-sm text-fg-muted transition hover:border-fg-subtle hover:text-fg">
          <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            disabled={busy}
            onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
            className="hidden"
          />
          <span>+ {t("upload")}</span>
        </label>
        <span className="text-sm text-fg-subtle">
          {files.length > 0
            ? t("filesSelected", { count: files.length })
            : t("noFilesSelected")}
        </span>
      </div>
      <p className="-mt-1 text-xs text-fg-subtle">{t("uploadHint")}</p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => switchMode("single")}
          className={modeBtnCls(mode === "single")}
        >
          {t("singleCosplayerMode")}
        </button>
        <button
          type="button"
          onClick={() => switchMode("multiple")}
          className={modeBtnCls(mode === "multiple")}
        >
          {t("multipleCosplayersMode")}
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {rows.map((row) => (
          <div
            key={row.key}
            className="flex flex-col gap-2 rounded-lg border border-border-strong/50 p-2"
          >
            <div className="flex gap-2">
              <input
                value={row.cosplayerCn}
                onChange={(e) => updateRow(row.key, { cosplayerCn: e.target.value })}
                onBlur={(e) => syncLinksToCn(row.key, e.target.value)}
                placeholder={t("cosplayerCn")}
                maxLength={200}
                list="known-cosplayers"
                className={inputCls}
              />
              <input
                value={row.characterName}
                onChange={(e) => updateRow(row.key, { characterName: e.target.value })}
                placeholder={t("characterName")}
                maxLength={200}
                className={inputCls}
              />
              {mode === "multiple" && rows.length > 1 && (
                <button
                  type="button"
                  aria-label={t("removeCosplayerAria")}
                  onClick={() => setRows((rs) => rs.filter((r) => r.key !== row.key))}
                  className={btnCls}
                >
                  ×
                </button>
              )}
            </div>
            <SocialLinksEditor
              links={row.socialLinks}
              onChange={(links) => updateRow(row.key, { socialLinks: links })}
            />
          </div>
        ))}
        {mode === "multiple" && (
          <button
            type="button"
            onClick={() => setRows((rs) => [...rs, emptyRow()])}
            className={`${btnCls} self-start`}
          >
            + {t("addCosplayer")}
          </button>
        )}
      </div>
      <p className="-mt-1 text-xs text-fg-subtle">{t("batchCreditHint")}</p>

      <button
        type="button"
        disabled={!canCreate}
        onClick={handleCreate}
        className="self-start rounded-lg bg-fg px-5 py-2 text-sm font-semibold text-page transition hover:opacity-90 disabled:opacity-40"
      >
        {busy ? "…" : tc("create")}
      </button>

      {status && (
        <div className="text-sm">
          <p className="text-fg-muted">
            {status.done < status.total
              ? t("uploading", { done: status.done, total: status.total })
              : t("uploadDone")}
          </p>
          {status.failed.map((name) => (
            <p key={name} className="text-danger">
              {t("uploadFailedFile", { name })}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
