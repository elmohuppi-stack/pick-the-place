import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { prisma } from "./prisma";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-change-me";

export interface AdminSession {
  email: string;
  name: string;
}

export async function verifyAdminCredentials(
  email: string,
  password: string,
): Promise<AdminSession | null> {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminName = process.env.ADMIN_NAME || "Admin";

  if (!adminEmail || !adminPassword) {
    return null;
  }

  // For first setup, compare directly (will be hashed later)
  if (email === adminEmail && password === adminPassword) {
    return { email: adminEmail, name: adminName };
  }

  return null;
}

export async function createAdminSession(
  session: AdminSession,
): Promise<string> {
  const token = jwt.sign(session, JWT_SECRET, { expiresIn: "24h" });
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
