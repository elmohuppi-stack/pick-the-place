import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyParticipantToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  const participant = token ? await verifyParticipantToken(token) : null;
  if (!participant) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (participant.event.status !== "proposal") {
    return NextResponse.json(
      { error: "Vorschlagsphase ist nicht aktiv" },
      { status: 400 },
    );
  }

  // Create a special "__optout__" location to track opt-out
  await prisma.location.create({
    data: {
      eventId: participant.eventId,
      name: "__optout__",
      description: `${participant.name} hat auf einen Vorschlag verzichtet`,
      proposedById: participant.id,
    },
  });

  return NextResponse.json({ success: true });
}
