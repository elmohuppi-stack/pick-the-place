import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get("eventId");

  if (!eventId) return NextResponse.json({ error: "eventId erforderlich" }, { status: 400 });

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { id: true, title: true, proposalEmailText: true, voteEmailText: true },
  });

  return NextResponse.json(event);
}

export async function PATCH(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { eventId, proposalEmailText, voteEmailText } = await request.json();

  if (!eventId) return NextResponse.json({ error: "eventId erforderlich" }, { status: 400 });

  const event = await prisma.event.update({
    where: { id: eventId },
    data: {
      ...(proposalEmailText !== undefined ? { proposalEmailText } : {}),
      ...(voteEmailText !== undefined ? { voteEmailText } : {}),
    },
  });

  return NextResponse.json(event);
}
