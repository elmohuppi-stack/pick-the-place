import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { prisma } from "./prisma";
import { COLLEAGUES, colleagueNameFromEmail } from "./colleagues";

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error(
      "JWT_SECRET ist nicht gesetzt. Bitte in der Umgebung konfigurieren (siehe .env.example).",
    );
  }
  return secret;
}

const JWT_SECRET = getJwtSecret();

export interface AdminSession {
  id: string;
  email: string;
  name: string;
}

/**
 * Legt fehlende Admin-Zugänge an: alle revenexx-Kollegen plus optional den
 * Env-Admin (ADMIN_EMAIL). Alle erhalten das gemeinsame Initial-Passwort aus
 * ADMIN_PASSWORD. Bewusst **create-if-missing**: bereits vorhandene Accounts
 * (inkl. individuell geänderter Passwörter) werden NICHT überschrieben.
 */
async function ensureAdminSeeded(): Promise<void> {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) return;

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminName = process.env.ADMIN_NAME || "Admin";

  // Gewünschte Zugänge zusammenstellen (Kollegen + optional Env-Admin), Duplikate
  // per E-Mail entfernen.
  const desired = new Map<string, string>(); // email -> name
  for (const c of COLLEAGUES) desired.set(c.email, c.name);
  if (adminEmail && !desired.has(adminEmail)) {
    desired.set(adminEmail, adminName);
  }

  const emails = [...desired.keys()];
  const existing = await prisma.adminUser.findMany({
    where: { email: { in: emails } },
    select: { email: true },
  });
  const existingEmails = new Set(existing.map((u) => u.email));

  const missing = emails.filter((email) => !existingEmails.has(email));
  if (missing.length === 0) return;

  const passwordHash = await bcrypt.hash(adminPassword, 12);
  await prisma.adminUser.createMany({
    data: missing.map((email) => ({
      email,
      name: desired.get(email) || colleagueNameFromEmail(email),
      passwordHash,
    })),
  });
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
