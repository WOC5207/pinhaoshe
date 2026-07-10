import { getLocale, getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { getCosplayerRoster, getSiteSettings } from "@/lib/settings";
import CosplayersManager, {
  type AdminCosplayer
} from "@/components/admin/CosplayersManager";

export default async function CosplayersPage() {
  const t = await getTranslations("adminCosplayers");
  const locale = await getLocale();
  const settings = await getSiteSettings();
  if (!settings.cosplayersEnabled) redirect(`/${locale}/admin`);
  const roster = await getCosplayerRoster();

  const cosplayers: AdminCosplayer[] = roster.map((c) => ({
    id: c.id,
    cosplayerCn: c.cosplayerCn,
    socialLinks: c.socialLinks.map((s) => ({ platform: s.platform, url: s.url }))
  }));

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="mt-1 text-fg-subtle">{t("intro")}</p>
      </div>
      <CosplayersManager cosplayers={cosplayers} />
    </div>
  );
}
