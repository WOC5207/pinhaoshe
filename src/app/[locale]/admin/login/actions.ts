"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { z } from "zod";
import {
  ensureAdminSeeded,
  getSession,
  verifyAdminCredentials
} from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

export type LoginState = {
  error?: "invalid" | "rateLimited" | "notConfigured";
};

const loginSchema = z.object({
  username: z.string().min(1).max(200),
  password: z.string().min(1).max(500)
});

async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
}

export async function login(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const ip = await clientIp();
  if (!rateLimit(`login:${ip}`, { limit: 10, windowMs: 15 * 60 * 1000 })) {
    return { error: "rateLimited" };
  }

  const parsed = loginSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password")
  });
  if (!parsed.success) return { error: "invalid" };

  try {
    await ensureAdminSeeded();
  } catch {
    return { error: "notConfigured" };
  }

  const ok = await verifyAdminCredentials(
    parsed.data.username,
    parsed.data.password
  );
  if (!ok) return { error: "invalid" };

  const session = await getSession();
  session.isAdmin = true;
  await session.save();

  const locale = await getLocale();
  redirect(`/${locale}/admin`);
}

export async function logout(): Promise<void> {
  const session = await getSession();
  session.destroy();
  const locale = await getLocale();
  redirect(`/${locale}/admin/login`);
}
