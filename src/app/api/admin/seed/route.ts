import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

export async function POST() {
  const session = await getAdminSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminName = process.env.ADMIN_NAME || "Admin";

  if (!adminEmail || !adminPassword) {
    return NextResponse.json(
      { error: "ADMIN_EMAIL und ADMIN_PASSWORD in .env.production nicht gesetzt" },
      { status: 400 },
    );
  }

  const passwordHash = await bcrypt.hash(adminPassword, 12);

  const existing = await prisma.adminUser.findUnique({
    where: { email: adminEmail },
  });

  if (existing) {
    await prisma.adminUser.update({
      where: { email: adminEmail },
      data: { passwordHash, name: adminName },
    });
    return NextResponse.json({
      success: true,
      message: `Passwort für ${adminEmail} aktualisiert`,
    });
  }

  const user = await prisma.adminUser.create({
    data: { email: adminEmail, name: adminName, passwordHash },
    select: { id: true, email: true, name: true },
  });

  return NextResponse.json({
    success: true,
    message: `Benutzer ${user.email} angelegt`,
    user,
  });
}
