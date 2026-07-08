"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

type UploadStatus = { total: number; done: number; failed: string[] };
type Mode = "single" | "multiple";
interface Row {
  key: number;
  cosplayerCn: string;
  characterName: string;
}

let rowKeySeq = 0;
function emptyRow(): Row {
  return { key: rowKeySeq++, cosplayerCn: "", characterName: "" };
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

export default function PhotoUploader({ eventId }: { eventId: string }) {
  const t = useTranslations("adminEvents");
  const tc = useTranslations("common");
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [files, setFiles] = useState<File[]>([]);
  const [mode, setMode] = useState<Mode>("single");
  const [singleCn, setSingleCn] = useState("");
  const [singleCharacter, setSingleCharacter] = useState("");
  const [rows, setRows] = useState<Row[]>(() => [emptyRow(), emptyRow()]);
  const [status, setStatus] = useState<UploadStatus | null>(null);
  const [busy, setBusy] = useState(false);

  const credits =
    mode === "single"
      ? singleCn.trim()
        ? [{ cosplayerCn: singleCn.trim(), characterName: singleCharacter.trim() }]
        : []
      : rows
          .map((r) => ({
            cosplayerCn: r.cosplayerCn.trim(),
            characterName: r.characterName.trim()
          }))
          .filter((r) => r.cosplayerCn.length > 0);

  const canCreate = !busy && files.length > 0 && credits.length > 0;

  function switchMode(next: Mode) {
    setMode(next);
    if (next === "multiple" && rows.length === 0) {
      setRows([emptyRow(), emptyRow()]);
    }
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
        for (const c of credits) {
          body.append("cosplayerCn", c.cosplayerCn);
          body.append("characterName", c.characterName);
        }
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
    setSingleCn("");
    setSingleCharacter("");
    setRows([emptyRow(), emptyRow()]);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-dashed border-border-strong p-4">
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

      {mode === "single" ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-fg-muted">
              {t("cosplayerCn")} <span className="text-red-400">*</span>
            </span>
            <input
              value={singleCn}
              onChange={(e) => setSingleCn(e.target.value)}
              maxLength={200}
              className={inputCls}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-fg-muted">{t("characterName")}</span>
            <input
              value={singleCharacter}
              onChange={(e) => setSingleCharacter(e.target.value)}
              maxLength={200}
              className={inputCls}
            />
          </label>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {rows.map((row) => (
            <div key={row.key} className="flex gap-2">
              <input
                value={row.cosplayerCn}
                onChange={(e) =>
                  setRows((rs) =>
                    rs.map((r) =>
                      r.key === row.key ? { ...r, cosplayerCn: e.target.value } : r
                    )
                  )
                }
                placeholder={t("cosplayerCn")}
                maxLength={200}
                className={inputCls}
              />
              <input
                value={row.characterName}
                onChange={(e) =>
                  setRows((rs) =>
                    rs.map((r) =>
                      r.key === row.key
                        ? { ...r, characterName: e.target.value }
                        : r
                    )
                  )
                }
                placeholder={t("characterName")}
                maxLength={200}
                className={inputCls}
              />
              {rows.length > 1 && (
                <button
                  type="button"
                  aria-label={t("removeCosplayerAria")}
                  onClick={() =>
                    setRows((rs) => rs.filter((r) => r.key !== row.key))
                  }
                  className={btnCls}
                >
                  ×
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() => setRows((rs) => [...rs, emptyRow()])}
            className={`${btnCls} self-start`}
          >
            + {t("addCosplayer")}
          </button>
        </div>
      )}
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
            <p key={name} className="text-red-400">
              {t("uploadFailedFile", { name })}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
