import { requireUser } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import PrincipleForm from '@/components/PrincipleForm';

export default async function NewPrinciplePage({ searchParams }: { searchParams: { from?: string } }) {
  const user = await requireUser();

  const entries = await prisma.entry.findMany({
    where: { userId: user.id, type: 'source_entry' },
    select: { id: true, sourceTitle: true, mainIdea: true },
    orderBy: { createdAt: 'desc' },
  });

  let preselected: string[] = [];
  if (searchParams.from) {
    const links = await prisma.link.findMany({
      where: { fromEntryId: searchParams.from, status: 'confirmed' },
      select: { toEntryId: true },
    });
    preselected = [searchParams.from, ...links.map((l) => l.toEntryId)].filter((id) =>
      entries.some((e) => e.id === id)
    );
  }

  return (
    <div>
      <h1 className="font-serif text-3xl font-bold mb-1">New principle</h1>
      <p className="text-ink/60 text-sm mb-6">
        A principle is a recurring pattern you&apos;ve noticed across entries — a first-class idea other entries can link up to.
      </p>
      <PrincipleForm entries={entries} preselected={preselected} />
    </div>
  );
}
