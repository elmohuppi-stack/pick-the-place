import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-change-me";

export async function POST(request: NextRequest) {
  const { token, newPassword } = await request.json();

  if (!token || !newPassword) {
    return NextResponse.json(
      { error: "Token und neues Passwort erforderlich" },
      { status: 400 },
    );
  }

  if (newPassword.length < 8) {
    return NextResponse.json(
      { error: "Passwort muss mindestens 8 Zeichen lang sein" },
      { status: 400 },
    );
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as {
      type: string;
      userId: string;
      email: string;
    };

    if (payload.type !== "password-reset") {
      return NextResponse.json(
        { error: "Ungültiger Reset-Token" },
        { status: 400 },
      );
    }

    const user = await prisma.adminUser.findUnique({
      where: { id: payload.userId },
    });
    if (!user || user.email !== payload.email) {
      return NextResponse.json(
        { error: "Benutzer nicht gefunden" },
        { status: 404 },
      );
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.adminUser.update({
      where: { id: payload.userId },
      data: { passwordHash },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Reset-Link ist abgelaufen oder ungültig" },
      { status: 400 },
    );
  }
}
