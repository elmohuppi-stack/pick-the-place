import { NextRequest, NextResponse } from "next/server";
import { verifyParticipantToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Token erforderlich" }, { status: 400 });
  }

  const participant = await verifyParticipantToken(token);
  if (!participant) {
    return NextResponse.json({ error: "Ungültiger Token" }, { status: 401 });
  }

  // Check if participant has opted out (proposed a location with name = "__optout__")
  const hasOptedOut = await prisma.location.findFirst({
    where: {
      eventId: participant.eventId,
      proposedById: participant.id,
      name: "__optout__",
    },
  });

  return NextResponse.json({
    participant: {
      id: participant.id,
      name: participant.name,
      email: participant.email,
      authToken: participant.authToken,
    },
    event: {
      id: participant.event.id,
      title: participant.event.title,
      status: participant.event.status,
    },
    hasOptedOut: !!hasOptedOut,
  });
}
