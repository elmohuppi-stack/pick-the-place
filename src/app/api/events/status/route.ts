import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

export async function PATCH(request: NextRequest) {
  const session = await getAdminSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { eventId, status } = await request.json();

  if (!eventId || !status) {
    return NextResponse.json(
      { error: "eventId und status erforderlich" },
      { status: 400 },
    );
  }

  const validStatuses = ["setup", "proposal", "voting", "results", "closed"];
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: "Ungültiger Status" }, { status: 400 });
  }

  const event = await prisma.event.update({
    where: { id: eventId },
    data: { status },
  });

  return NextResponse.json(event);
}
