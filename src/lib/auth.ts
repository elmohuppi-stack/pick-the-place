import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-change-me";

export interface AdminSession {
  id: string;
  email: string;
  name: string;
}

/** Ensure env-var admin exists; updates password if already present */
async function ensureAdminSeeded(): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminName = process.env.ADMIN_NAME || "Admin";

  if (!adminEmail || !adminPassword) return;

  const existing = await prisma.adminUser.findUnique({
    where: { email: adminEmail },
  });

  const passwordHash = await bcrypt.hash(adminPassword, 12);

  if (existing) {
    // Update password hash in case env changed
    await prisma.adminUser.update({
      where: { email: adminEmail },
      data: { passwordHash, name: adminName },
    });
  } else {
    await prisma.adminUser.create({
      data: { email: adminEmail, name: adminName, passwordHash },
    });
  }
}

export async function verifyAdminCredentials(
  email: string,
  password: string,
): Promise<AdminSession | null> {
  await ensureAdminSeeded();

  const user = await prisma.adminUser.findUnique({ where: { email } });
  if (!user) return null;

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return null;

  return { id: user.id, email: user.email, name: user.name };
}

export async function createAdminSession(
  session: AdminSession,
): Promise<string> {
  const token = jwt.sign(
    { id: session.id, email: session.email, name: session.name },
    JWT_SECRET,
    { expiresIn: "24h" },
  );
  return token;
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!token) return null;

  try {
    const session = jwt.verify(token, JWT_SECRET) as AdminSession;
    return session;
  } catch {
    return null;
  }
}

export async function verifyParticipantToken(token: string) {
  if (!token) return null;

  const participant = await prisma.participant.findUnique({
    where: { authToken: token },
    include: { event: true },
  });

  return participant;
}
