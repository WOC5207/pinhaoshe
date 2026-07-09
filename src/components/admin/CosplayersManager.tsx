"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import {
  addCosplayer,
  updateCosplayer,
  deleteCosplayer,
  type CosplayerState
} from "@/app/[locale]/admin/(protected)/cosplayers/actions";
import SocialLinksEditor, {
  emptySocialLink,
  type SocialLinkValue
} from "./SocialLinksEditor";

export interface AdminCosplayer {
  id: string;
  cosplayerCn: string;
  socialLinks: { platform: string; url: string }[];
}

const inputCls =
  "rounded-lg border border-border-strong bg-surface px-3 py-2 text-sm text-fg outline-none focus:border-fg-subtle";
const btnCls =
  "rounded-md border border-border-strong px-2 py-1 text-xs text-fg-muted transition hover:border-fg-faint hover:text-fg disabled:opacity-40";

function CosplayerRow({ cosplayer }: { cosplayer: AdminCosplayer }) {
  const t = useTranslations("adminCosplayers");
  const tc = useTranslations("common");
  const [links, setLinks] = useState<SocialLinkValue[]>(() =>
    cosplayer.socialLinks.map((s) => emptySocialLink(s))
  );
  const socialLinksJson = JSON.stringify(
    links.map((l) => ({ platform: l.platform, url: l.url }))
  );

  return (
    <li className="rounded-xl border border-border bg-surface p-3">
      <form action={updateCosplayer} className="flex flex-col gap-2">
        <input type="hidden" name="id" value={cosplayer.id} />
        <input type="hidden" name="socialLinksJson" value={socialLinksJson} />
        <input
          name="cosplayerCn"
          defaultValue={cosplayer.cosplayerCn}
          placeholder={t("cosplayerCnPlaceholder")}
          maxLength={200}
          className={inputCls}
        />
        <SocialLinksEditor links={links} onChange={setLinks} />
        <div className="flex gap-2">
          <button type="submit" className={btnCls}>
            {tc("save")}
          </button>
        </div>
      </form>
      <form
        action={deleteCosplayer}
        onSubmit={(e) => {
          if (!confirm(t("confirmDelete"))) e.preventDefault();
        }}
        className="mt-2"
      >
        <input type="hidden" name="id" value={cosplayer.id} />
        <button
          type="submit"
          className={`${btnCls} border-danger-border text-danger hover:border-danger hover:text-danger-strong`}
        >
          {tc("delete")}
        </button>
      </form>
    </li>
  );
}

export default function CosplayersManager({
  cosplayers
}: {
  cosplayers: AdminCosplayer[];
}) {
  const t = useTranslations("adminCosplayers");
  const [state, formAction, pending] = useActionState<CosplayerState, FormData>(
    addCosplayer,
    {}
  );

  return (
    <div className="flex flex-col gap-4">
      {cosplayers.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {cosplayers.map((c) => (
            <CosplayerRow key={c.id} cosplayer={c} />
          ))}
        </ul>
      ) : (
        <p className="text-sm text-fg-subtle">{t("noCosplayers")}</p>
      )}

      <form
        action={formAction}
        className="flex flex-wrap gap-2 rounded-xl border border-dashed border-border-strong p-3"
      >
        <input
          name="cosplayerCn"
          placeholder={t("cosplayerCnPlaceholder")}
          maxLength={200}
          className={`${inputCls} flex-1`}
        />
        <button type="submit" disabled={pending} className={btnCls}>
          + {t("addCosplayer")}
        </button>
      </form>
      {state.error === "validation" && (
        <p className="text-xs text-danger">{t("validationError")}</p>
      )}
      {state.error === "duplicate" && (
        <p className="text-xs text-danger">{t("duplicateError")}</p>
      )}
    </div>
  );
}
