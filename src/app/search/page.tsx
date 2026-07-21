import Link from 'next/link';
import { requireUser } from '@/lib/session';
import { prisma } from '@/lib/prisma';

export default async function SearchPage({ searchParams }: { searchParams: { q?: string } }) {
  const user = await requireUser();
  const q = (searchParams.q || '').trim();

  let entries: Awaited<ReturnType<typeof searchEntries>> = [];
  let questions: Awaited<ReturnType<typeof searchQuestions>> = [];
  let replies: Awaited<ReturnType<typeof searchReplies>> = [];

  if (q) {
    [entries, questions, replies] = await Promise.all([searchEntries(user.id, q), searchQuestions(user.id, q), searchReplies(user.id, q)]);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-bold mb-4">Search</h1>
        <form className="flex gap-2">
          <input name="q" defaultValue={q} placeholder="Search entries, principles, questions, threads…" className="input" autoFocus />
          <button type="submit" className="btn-primary">
            Search
          </button>
        </form>
      </div>

      {q && (
        <div className="space-y-8">
          <section>
            <h2 className="font-serif text-lg font-semibold mb-3">Entries & principles ({entries.length})</h2>
            {entries.length === 0 ? (
              <p className="text-sm text-ink/50">No matches.</p>
            ) : (
              <div className="space-y-2">
                {entries.map((e) => (
                  <Link key={e.id} href={`/entry/${e.id}`} className="card block p-3 hover:border-accent/50">
                    <span className="text-xs text-ink/40">{e.type === 'principle' ? 'Principle' : e.sourceType}</span>
                    <p className="font-medium">{e.sourceTitle}</p>
                    <p className="text-sm text-ink/60 line-clamp-1">{e.mainIdea}</p>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="font-serif text-lg font-semibold mb-3">Questions ({questions.length})</h2>
            {questions.length === 0 ? (
              <p className="text-sm text-ink/50">No matches.</p>
            ) : (
              <div className="space-y-2">
                {questions.map((qn) => (
                  <Link key={qn.id} href={`/entry/${qn.sourceEntry.id}`} className="card block p-3 hover:border-accent/50 text-sm">
                    {qn.text}
                    <span className="text-xs text-ink/40 block mt-1">from {qn.sourceEntry.sourceTitle}</span>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="font-serif text-lg font-semibold mb-3">Shared discussion threads ({replies.length})</h2>
            {replies.length === 0 ? (
              <p className="text-sm text-ink/50">No matches.</p>
            ) : (
              <div className="space-y-2">
                {replies.map((r) => (
                  <Link key={r.id} href={`/s/${r.shareEvent.token}`} className="card block p-3 hover:border-accent/50 text-sm">
                    &ldquo;{r.text}&rdquo;
                    <span className="text-xs text-ink/40 block mt-1">
                      {r.user.name} on {r.shareEvent.entry.sourceTitle}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function searchEntries(userId: string, q: string) {
  return prisma.entry.findMany({
    where: {
      userId,
      OR: [
        { sourceTitle: { contains: q } },
        { mainIdea: { contains: q } },
        { explanation: { contains: q } },
        { quote: { contains: q } },
        { surprise: { contains: q } },
        { whyItMatters: { contains: q } },
        { takeaways: { some: { text: { contains: q } } } },
      ],
    },
    take: 20,
    orderBy: { createdAt: 'desc' },
  });
}

function searchQuestions(userId: string, q: string) {
  return prisma.question.findMany({
    where: { userId, accepted: true, text: { contains: q } },
    include: { sourceEntry: { select: { id: true, sourceTitle: true } } },
    take: 20,
    orderBy: { createdAt: 'desc' },
  });
}

function searchReplies(userId: string, q: string) {
  return prisma.reply.findMany({
    where: {
      text: { contains: q },
      shareEvent: { OR: [{ ownerId: userId }, { circle: { members: { some: { userId } } } }] },
    },
    include: { user: true, shareEvent: { include: { entry: { select: { sourceTitle: true } } } } },
    take: 20,
    orderBy: { createdAt: 'desc' },
  });
}
