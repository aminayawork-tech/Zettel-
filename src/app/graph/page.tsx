import { requireUser } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import GraphView from '@/components/GraphView';

export default async function GraphPage({ searchParams }: { searchParams: { focus?: string } }) {
  const user = await requireUser();

  const entries = await prisma.entry.findMany({
    where: { userId: user.id },
    select: { id: true, sourceTitle: true, sourceType: true, type: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });

  const links = await prisma.link.findMany({
    where: { status: 'confirmed', fromEntry: { userId: user.id } },
    select: { id: true, fromEntryId: true, toEntryId: true, relationType: true },
  });

  return (
    <div>
      <h1 className="font-serif text-3xl font-bold mb-1">Graph</h1>
      <p className="text-ink/60 text-sm mb-6">Every confirmed connection between your entries and principles.</p>
      <GraphView
        nodes={entries.map((e) => ({
          id: e.id,
          title: e.sourceTitle,
          sourceType: e.sourceType,
          type: e.type,
          createdAt: e.createdAt.toISOString(),
        }))}
        edges={links}
        focusId={searchParams.focus}
      />
    </div>
  );
}
