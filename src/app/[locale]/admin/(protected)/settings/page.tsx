import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/datetime";
import { siteImageUrl } from "@/lib/images";
import { getSiteSettings, getContactMethods } from "@/lib/settings";
import SiteSettingsForm from "@/components/admin/SiteSettingsForm";
import SiteImageUploader from "@/components/admin/SiteImageUploader";
import QuickLinksManager from "@/components/admin/QuickLinksManager";
import ContactMethodsManager from "@/components/admin/ContactMethodsManager";

export default async function SiteSettingsPage() {
  const t = await getTranslations("adminSite");

  const settings = await getSiteSettings();
  const quickLinks = await prisma.quickLink.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
  });
  const contactMethods = await getContactMethods();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="mt-1 text-fg-subtle">{t("intro")}</p>
      </div>

      <SiteSettingsForm
        initial={{
          siteTitleEn: settings.siteTitleEn,
          siteTitleZh: settings.siteTitleZh,
          homeTitleEn: settings.homeTitleEn,
          homeTitleZh: settings.homeTitleZh,
          homeSubtitleEn: settings.homeSubtitleEn,
          homeSubtitleZh: settings.homeSubtitleZh,
          backgroundColor: settings.backgroundColor
        }}
      />

      <SiteImageUploader kind="logo" currentUrl={siteImageUrl(settings.logo)} />
      <SiteImageUploader
        kind="background"
        currentUrl={siteImageUrl(settings.backgroundImage)}
      />

      <QuickLinksManager
        links={quickLinks.map((q) => ({
          id: q.id,
          titleEn: q.titleEn,
          titleZh: q.titleZh,
          url: q.url,
          date: q.date ? formatDate(q.date) : ""
        }))}
      />

      <ContactMethodsManager
        methods={contactMethods.map((m) => ({
          id: m.id,
          labelEn: m.labelEn,
          labelZh: m.labelZh
        }))}
      />
    </div>
  );
}
