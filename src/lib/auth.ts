import "server-only";
import { getIronSession, type IronSession } from "iron-session";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "./db";
import { config } from "./config";

export interface SessionData {
  isAdmin?: boolean;
}

export async function getSession(): Promise<IronSession<SessionData>> {
  return getIronSession<SessionData>(await cookies(), {
    password: config.sessionSecret(),
    cookieName: "pinhaoshe_session",
    cookieOptions: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7 // 7 days
    }
  });
}

export async function isAdmin(): Promise<boolean> {
  const session = await getSession();
  return session.isAdmin === true;
}

/**
 * Guard for admin server actions and pages. Redirects to the login page
 * (locale-prefixed paths both exist, so plain "/zh/..." is fine here).
 */
export async function requireAdmin(locale: string = "zh"): Promise<void> {
  if (!(await isAdmin())) {
    redirect(`/${locale}/admin/login`);
  }
}

/**
 * First-run seeding: if no admin exists yet, create one from
 * ADMIN_USERNAME / ADMIN_PASSWORD. Called before verifying a login.
 */
export async function ensureAdminSeeded(): Promise<void> {
  const count = await prisma.adminUser.count();
  if (count > 0) return;

  const username = config.adminUsername();
  const password = config.adminPassword();
  if (!username || !password) {
    throw new Error(
      "No admin account exists and ADMIN_USERNAME / ADMIN_PASSWORD are not set."
    );
  }
  await prisma.adminUser.create({
    data: { username, passwordHash: await bcrypt.hash(password, 12) }
  });
}

export async function verifyAdminCredentials(
  username: string,
  password: string
): Promise<boolean> {
  const admin = await prisma.adminUser.findUnique({ where: { username } });
  if (!admin) {
    // Constant-ish time: hash anyway so missing users take as long as bad passwords
    await bcrypt.compare(password, "$2a$12$C6UzMDM.H6dfI/f/IKcEeO7Y1r1qcYvfkq0ZC0mLpFvQ9CQxq3l4u");
    return false;
  }
  return bcrypt.compare(password, admin.passwordHash);
}
