import Link from 'next/link';
import { requireUser } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import EntryCard from '@/components/EntryCard';

export default async function JournalPage({
  searchParams,
}: {
  searchParams: { type?: string };
}) {
  const user = await requireUser();
  const filterType = searchParams.type === 'principle' ? 'principle' : searchParams.type === 'source_entry' ? 'source_entry' : undefined;

  const entries = await prisma.entry.findMany({
    where: { userId: user.id, ...(filterType ? { type: filterType } : {}) },
    orderBy: { createdAt: 'desc' },
    include: { tags: { include: { tag: true } } },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold">Your journal</h1>
          <p className="text-ink/60 text-sm mt-1">{entries.length} {entries.length === 1 ? 'entry' : 'entries'}</p>
        </div>
        <Link href="/journal/new" className="btn-primary">
          + New entry
        </Link>
      </div>

      <div className="flex gap-2 mb-6 text-sm">
        <Link href="/journal" className={`btn-ghost ${!filterType ? 'bg-ink/5 text-ink' : ''}`}>
          All
        </Link>
        <Link href="/journal?type=source_entry" className={`btn-ghost ${filterType === 'source_entry' ? 'bg-ink/5 text-ink' : ''}`}>
          Entries
        </Link>
        <Link href="/journal?type=principle" className={`btn-ghost ${filterType === 'principle' ? 'bg-ink/5 text-ink' : ''}`}>
          Principles
        </Link>
      </div>

      {entries.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="font-serif text-xl mb-2">Nothing here yet.</p>
          <p className="text-ink/60 text-sm mb-4">
            Finish something — a book, a podcast, a conversation — and turn it into your first reflection.
          </p>
          <Link href="/journal/new" className="btn-primary">
            Write your first entry
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {entries.map((entry) => (
            <EntryCard key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
}
