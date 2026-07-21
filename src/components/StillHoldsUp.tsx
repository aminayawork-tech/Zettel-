'use client';

import { useTransition } from 'react';
import { rateEntry } from '@/app/actions/entries';

export default function StillHoldsUp({
  entryId,
  stillHoldsUp,
  lastRatedAt,
}: {
  entryId: string;
  stillHoldsUp: boolean | null;
  lastRatedAt: Date | null;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <section className="card p-4 flex items-center justify-between text-sm">
      <span className="text-ink/60">
        Does this still hold up?
        {lastRatedAt && (
          <span className="text-ink/40">
            {' '}
            — last rated {stillHoldsUp ? 'yes' : 'no'} on {lastRatedAt.toLocaleDateString()}
          </span>
        )}
      </span>
      <div className="flex gap-2">
        <button disabled={pending} className="btn-secondary text-xs py-1" onClick={() => startTransition(() => rateEntry(entryId, true))}>
          Still true
        </button>
        <button disabled={pending} className="btn-ghost text-xs py-1" onClick={() => startTransition(() => rateEntry(entryId, false))}>
          Not anymore
        </button>
      </div>
    </section>
  );
}
