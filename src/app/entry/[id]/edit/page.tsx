import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import EntryForm, { type EditableEntry } from '@/components/EntryForm';

export default async function EditEntryPage({ params }: { params: { id: string } }) {
  const user = await requireUser();

  const entry = await prisma.entry.findUnique({
    where: { id: params.id },
    include: {
      takeaways: { orderBy: { position: 'asc' } },
      tags: { include: { tag: true } },
    },
  });

  if (!entry || entry.userId !== user.id) notFound();

  const initialEntry: EditableEntry = {
    sourceTitle: entry.sourceTitle,
    sourceType: entry.sourceType,
    sourceLink: entry.sourceLink || '',
    headline: entry.headline || '',
    mainIdea: entry.mainIdea,
    takeaways: entry.takeaways.map((t) => t.text),
    surprise: entry.surprise || '',
    whyItMatters: entry.whyItMatters || '',
    action: entry.action || '',
    explanation: entry.explanation || '',
    quote: entry.quote || '',
    tags: entry.tags.map((t) => t.tag.name).join(', '),
    quickMode: entry.quickMode,
  };

  return <EntryForm mode="edit" entryId={entry.id} initialEntry={initialEntry} />;
}
