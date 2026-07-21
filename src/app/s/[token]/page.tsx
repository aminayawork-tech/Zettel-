import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { timeAgo } from '@/lib/utils';
import ReplyBox from '@/components/ReplyBox';

export default async function SharePage({ params }: { params: { token: string } }) {
  const shareEvent = await prisma.shareEvent.findUnique({
    where: { token: params.token },
    include: {
      owner: true,
      entry: true,
      replies: { include: { user: true }, orderBy: { createdAt: 'asc' } },
    },
  });

  if (!shareEvent) notFound();
  const { entry } = shareEvent;

  const body =
    shareEvent.scope === 'takeaway' || shareEvent.scope === 'quote'
      ? shareEvent.snippet
      : entry.mainIdea;

  return (
    <div className="min-h-screen bg-paper">
      <div className="max-w-xl mx-auto px-4 py-12 space-y-6">
        <div className="text-center">
          <p className="font-serif text-xl font-bold">Zettel</p>
          <p className="text-xs text-ink/40 mt-1">A reflection from {shareEvent.owner.name}</p>
        </div>

        <div className="card p-6">
          <p className="text-xs text-ink/40 uppercase tracking-wide">{entry.sourceType}</p>
          <h1 className="font-serif text-2xl font-bold mt-1">{entry.sourceTitle}</h1>
          <p className="font-serif text-lg mt-4 leading-relaxed">
            {shareEvent.scope === 'quote' ? `“${body}”` : body}
          </p>
          {shareEvent.scope === 'full_entry' && entry.whyItMatters && (
            <div className="mt-4 pt-4 border-t border-ink/10">
              <p className="label mb-1">Why it matters</p>
              <p className="text-sm">{entry.whyItMatters}</p>
            </div>
          )}
        </div>

        <div className="card p-5">
          <h2 className="font-serif text-lg font-semibold mb-3">
            {shareEvent.replies.length} repl{shareEvent.replies.length === 1 ? 'y' : 'ies'}
          </h2>
          <div className="space-y-3 mb-4">
            {shareEvent.replies.map((r) => (
              <div key={r.id} className="text-sm border border-ink/10 rounded-md px-3 py-2">
                <div className="flex items-center justify-between text-xs text-ink/40 mb-1">
                  <span className="font-medium text-ink/70">{r.user.name}</span>
                  <span>{timeAgo(r.createdAt)}</span>
                </div>
                <p>{r.text}</p>
              </div>
            ))}
          </div>
          <ReplyBox token={shareEvent.token} />
        </div>
      </div>
    </div>
  );
}
