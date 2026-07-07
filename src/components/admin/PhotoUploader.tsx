"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

type UploadStatus = { total: number; done: number; failed: string[] };

export default function PhotoUploader({ eventId }: { eventId: string }) {
  const t = useTranslations("adminEvents");
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<UploadStatus | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
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
        const res = await fetch("/api/admin/photos", { method: "POST", body });
        if (!res.ok) failed.push(file.name);
      } catch {
        failed.push(file.name);
      }
      setStatus({ total, done: i + 1, failed: [...failed] });
    }

    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="flex w-fit cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border-strong px-4 py-3 text-sm text-fg-muted transition hover:border-fg-subtle hover:text-fg">
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          disabled={busy}
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />
        <span>{busy ? "…" : `+ ${t("upload")}`}</span>
      </label>
      <p className="text-xs text-fg-subtle">{t("uploadHint")}</p>
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
