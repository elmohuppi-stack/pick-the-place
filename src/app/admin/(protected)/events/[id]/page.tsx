import { Suspense } from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { EventWorkspace } from "./event-workspace";

export default async function EventWorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      participants: {
        select: { id: true, name: true, email: true },
        orderBy: { createdAt: "asc" },
      },
      locations: {
        include: { proposedBy: { select: { name: true } } },
        orderBy: { createdAt: "asc" },
      },
      votingRounds: {
        orderBy: { roundNumber: "desc" },
        include: { _count: { select: { votes: true } } },
      },
    },
  });

  if (!event) notFound();

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin w-8 h-8 border-4 border-revenexx-500 border-t-transparent rounded-full" />
        </div>
      }
    >
      <EventWorkspace event={event} />
    </Suspense>
  );
}
