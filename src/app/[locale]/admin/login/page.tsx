import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

// Reads the session cookie — never prerender.
export const dynamic = "force-dynamic";
import { isAdmin } from "@/lib/auth";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import LoginForm from "./LoginForm";

export default async function LoginPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (await isAdmin()) redirect(`/${locale}/admin`);
  const t = await getTranslations("auth");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 px-4">
      <div className="absolute right-4 top-4">
        <LanguageSwitcher />
      </div>
      <h1 className="text-2xl font-bold">{t("loginTitle")}</h1>
      <LoginForm />
    </div>
  );
}
