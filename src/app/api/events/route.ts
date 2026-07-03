import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

export async function GET() {
  const session = await getAdminSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const events = await prisma.event.findMany({
    include: {
      _count: {
        select: { participants: true, locations: true, votingRounds: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(events);
}

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, description, eventDate } = await request.json();

  if (!title) {
    return NextResponse.json({ error: "Titel erforderlich" }, { status: 400 });
  }

  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const parsedDate = eventDate ? new Date(eventDate) : null;

  const event = await prisma.event.create({
    data: {
      title,
      slug: `${slug}-${Date.now()}`,
      description,
      eventDate:
        parsedDate && !isNaN(parsedDate.getTime()) ? parsedDate : null,
    },
  });

  return NextResponse.json(event, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const session = await getAdminSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id erforderlich" }, { status: 400 });
  }

  await prisma.event.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
