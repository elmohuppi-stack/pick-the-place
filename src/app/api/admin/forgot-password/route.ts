import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import { sendPasswordReset } from "@/lib/email";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-change-me";
const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://pick-the-place.elmarhepp.de";

// Öffentlicher Self-Service-Endpoint: Ein Admin, der sein Passwort vergessen
// hat, fordert hier selbst einen Reset-Link an – er wird per E-Mail an die
// hinterlegte Adresse geschickt. Damit niemand herausfinden kann, welche
// Adressen Admin-Zugänge sind, antworten wir IMMER generisch mit success,
// egal ob der Benutzer existiert oder nicht.
export async function POST(request: NextRequest) {
  const { email } = await request.json();

  const genericResponse = NextResponse.json({ success: true });

  if (!email || typeof email !== "string") {
    return genericResponse;
  }

  // Exakter Match auf die getrimmte Adresse – konsistent zum Login, das die
  // E-Mail ebenfalls unverändert (case-sensitive) prüft.
  const user = await prisma.adminUser.findUnique({
    where: { email: email.trim() },
  });

  if (user) {
    // Kurzlebiger Reset-Token (1 Stunde) – identisch zum Admin-Reset-Link.
    const resetToken = jwt.sign(
      { type: "password-reset", userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: "1h" },
    );

    const resetLink = `${APP_URL}/admin/login?reset=${resetToken}`;

    try {
      await sendPasswordReset(user.email, user.name, resetLink);
    } catch (err) {
      // Fehler beim Versand nicht nach außen durchreichen (keine Enumeration),
      // aber serverseitig protokollieren.
      console.error("Failed to send password reset email:", err);
    }
  }

  return genericResponse;
}
