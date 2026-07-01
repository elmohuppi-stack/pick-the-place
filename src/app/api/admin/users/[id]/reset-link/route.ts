import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-change-me";
const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://pick-the-place.elmarhepp.de";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getAdminSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const user = await prisma.adminUser.findUnique({ where: { id } });
  if (!user) {
    return NextResponse.json(
      { error: "Benutzer nicht gefunden" },
      { status: 404 },
    );
  }

  // Generate a short-lived reset token (1 hour)
  const resetToken = jwt.sign(
    { type: "password-reset", userId: id, email: user.email },
    JWT_SECRET,
    { expiresIn: "1h" },
  );

  const resetLink = `${APP_URL}/admin/login?reset=${resetToken}`;

  return NextResponse.json({ resetLink });
}
