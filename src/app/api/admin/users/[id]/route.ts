import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getAdminSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  // Prevent deleting yourself
  if (id === session.id) {
    return NextResponse.json(
      { error: "Du kannst dich nicht selbst löschen" },
      { status: 400 },
    );
  }

  const user = await prisma.adminUser.findUnique({ where: { id } });
  if (!user) {
    return NextResponse.json(
      { error: "Benutzer nicht gefunden" },
      { status: 404 },
    );
  }

  await prisma.adminUser.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
