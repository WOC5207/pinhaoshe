import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { getSiteSettings } from "@/lib/settings";

export default async function BookingsLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const settings = await getSiteSettings();
  if (!settings.bookingEnabled) {
    const locale = await getLocale();
    redirect(`/${locale}/admin`);
  }
  return children;
}
