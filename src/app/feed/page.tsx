import Link from 'next/link';
import { requireUser } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { timeAgo } from '@/lib/utils';

export default async function FeedPage() {
  const user = await requireUser();

  const circleIds = (
    await prisma.circleMember.findMany({ where: { userId: user.id }, select: { circleId: true } })
  ).map((c) => c.circleId);

  const shareEvents = await prisma.shareEvent.findMany({
    where: { circleId: { in: circleIds } },
    include: {
      owner: true,
      entry: { select: { sourceTitle: true, mainIdea: true, sourceType: true, type: true } },
      circle: true,
      replies: { include: { user: true }, orderBy: { createdAt: 'asc' } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold mb-1">Feed</h1>
        <p className="text-ink/60 text-sm">What people in your circles have shared recently.</p>
      </div>

      {shareEvents.length === 0 ? (
        <div className="card p-10 text-center text-ink/50">
          Nothing shared yet. Join or create a circle, then check back once someone shares a reflection.
        </div>
      ) : (
        <div className="space-y-4">
          {shareEvents.map((s) => (
            <div key={s.id} className="card p-5">
              <div className="flex items-center justify-between text-xs text-ink/40 mb-2">
                <span>
                  {s.owner.name} shared to <span className="font-medium">{s.circle?.name}</span>
                </span>
                <span>{timeAgo(s.createdAt)}</span>
              </div>
              <p className="font-serif text-lg font-semibold">{s.entry.sourceTitle}</p>
              <p className="text-sm mt-1">
                {s.scope === 'full_entry' ? s.entry.mainIdea : s.snippet}
              </p>
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs text-ink/40">
                  {s.replies.length} repl{s.replies.length === 1 ? 'y' : 'ies'}
                </span>
                <Link href={`/s/${s.token}`} className="btn-ghost text-xs">
                  Open thread →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
