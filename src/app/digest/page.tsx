import Link from 'next/link';
import { requireUser } from '@/lib/session';
import { getDigest } from '@/lib/digest';
import { RELATION_LABELS, type RelationType } from '@/lib/enums';
import StillHoldsUp from '@/components/StillHoldsUp';

export default async function DigestPage() {
  const user = await requireUser();
  const { openQuestions, pendingConnections, unfollowedActions, resurfaced } = await getDigest(user.id);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-bold mb-1">Weekly digest</h1>
        <p className="text-ink/60 text-sm">What&apos;s still open, still waiting, or worth a second look.</p>
      </div>

      <section className="card p-5">
        <h2 className="font-serif text-lg font-semibold mb-3">Open questions ({openQuestions.length})</h2>
        {openQuestions.length === 0 ? (
          <p className="text-sm text-ink/50">Nothing open — nice.</p>
        ) : (
          <ul className="space-y-2">
            {openQuestions.map((q) => (
              <li key={q.id} className="text-sm border border-ink/10 rounded-md px-3 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3">
                <span className="min-w-0">{q.text}</span>
                <Link href={`/entry/${q.sourceEntry.id}`} className="text-xs text-accent whitespace-nowrap shrink-0">
                  {q.sourceEntry.sourceTitle} →
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card p-5">
        <h2 className="font-serif text-lg font-semibold mb-3">Actions not yet followed up ({unfollowedActions.length})</h2>
        {unfollowedActions.length === 0 ? (
          <p className="text-sm text-ink/50">All caught up.</p>
        ) : (
          <ul className="space-y-2">
            {unfollowedActions.map((e) => (
              <li key={e.id} className="text-sm border border-ink/10 rounded-md px-3 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3">
                <span className="min-w-0">{e.action}</span>
                <Link href={`/entry/${e.id}`} className="text-xs text-accent whitespace-nowrap shrink-0">
                  {e.sourceTitle} →
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card p-5">
        <h2 className="font-serif text-lg font-semibold mb-3">New connections awaiting confirmation ({pendingConnections.length})</h2>
        {pendingConnections.length === 0 ? (
          <p className="text-sm text-ink/50">Nothing pending.</p>
        ) : (
          <ul className="space-y-2">
            {pendingConnections.map((l) => (
              <li key={l.id} className="text-sm border border-ink/10 rounded-md px-3 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3">
                <span className="min-w-0">
                  <span className="chip bg-accent/10 text-accent mr-2">{RELATION_LABELS[l.relationType as RelationType]}</span>
                  {l.fromEntry.sourceTitle} ↔ {l.toEntry.sourceTitle}
                </span>
                <Link href={`/entry/${l.fromEntry.id}`} className="text-xs text-accent whitespace-nowrap shrink-0">
                  Review →
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="font-serif text-lg font-semibold mb-3">Does this still hold up?</h2>
        {resurfaced.length === 0 ? (
          <p className="text-sm text-ink/50">Nothing to resurface yet — check back once your journal has a bit more history.</p>
        ) : (
          <div className="space-y-3">
            {resurfaced.map((e) => (
              <div key={e.id} className="card p-5">
                <Link href={`/entry/${e.id}`} className="font-medium hover:text-accent">
                  {e.sourceTitle}
                </Link>
                <p className="text-sm text-ink/70 mt-1 mb-3">{e.mainIdea}</p>
                <StillHoldsUp entryId={e.id} stillHoldsUp={e.stillHoldsUp} lastRatedAt={e.lastRatedAt} />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
