import { requireUser } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import CalendarView from '@/components/CalendarView';

export default async function CalendarPage() {
  const user = await requireUser();

  const entries = await prisma.entry.findMany({
    where: { userId: user.id },
    select: { id: true, sourceTitle: true, headline: true, mainIdea: true, type: true, sourceType: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div>
      <h1 className="font-serif text-3xl font-bold mb-1">Calendar</h1>
      <p className="text-ink/60 text-sm mb-6">Every day you showed up to reflect.</p>
      <CalendarView
        entries={entries.map((e) => ({
          id: e.id,
          sourceTitle: e.headline || e.sourceTitle,
          mainIdea: e.mainIdea,
          type: e.type,
          sourceType: e.sourceType,
          createdAt: e.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
