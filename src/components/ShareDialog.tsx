'use client';

import { useState, useTransition } from 'react';
import { shareEntry } from '@/app/actions/share';
import type { ShareScope } from '@/lib/enums';

export default function ShareDialog({
  entry,
  circles,
  takeaways,
}: {
  entry: { id: string; sourceTitle: string; mainIdea: string; quote: string | null };
  circles: { id: string; name: string }[];
  takeaways: string[];
}) {
  const [open, setOpen] = useState(false);
  const [scope, setScope] = useState<ShareScope>('full_entry');
  const [takeawayIdx, setTakeawayIdx] = useState(0);
  const [circleId, setCircleId] = useState('');
  const [link, setLink] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleShare() {
    const snippet = scope === 'takeaway' ? takeaways[takeawayIdx] : scope === 'quote' ? entry.quote || '' : undefined;
    startTransition(async () => {
      const token = await shareEntry({ entryId: entry.id, scope, snippet, circleId: circleId || null });
      setLink(`${window.location.origin}/s/${token}`);
    });
  }

  if (!open) {
    return (
      <button className="btn-secondary" onClick={() => setOpen(true)}>
        Share this entry
      </button>
    );
  }

  return (
    <section className="card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-lg font-semibold">Share</h2>
        <button className="text-ink/40 hover:text-ink text-sm" onClick={() => setOpen(false)}>
          Close
        </button>
      </div>
      <p className="text-xs text-ink/50">Private by default — nothing leaves your journal until you choose to share it.</p>

      <div>
        <label className="label">What to share</label>
        <select className="input" value={scope} onChange={(e) => setScope(e.target.value as ShareScope)}>
          <option value="full_entry">The full entry</option>
          {takeaways.length > 0 && <option value="takeaway">Just one takeaway</option>}
          {entry.quote && <option value="quote">Just the quote</option>}
        </select>
      </div>

      {scope === 'takeaway' && takeaways.length > 0 && (
        <div>
          <label className="label">Which takeaway</label>
          <select className="input" value={takeawayIdx} onChange={(e) => setTakeawayIdx(Number(e.target.value))}>
            {takeaways.map((t, i) => (
              <option key={i} value={i}>
                {t}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="label">With whom</label>
        <select className="input" value={circleId} onChange={(e) => setCircleId(e.target.value)}>
          <option value="">Anyone with the link</option>
          {circles.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <button disabled={pending} className="btn-primary" onClick={handleShare}>
        {pending ? 'Creating link…' : 'Create shareable link'}
      </button>

      {link && (
        <div className="text-sm bg-ink/5 rounded-md p-3 break-all">
          <a href={link} className="text-accent underline" target="_blank" rel="noreferrer">
            {link}
          </a>
        </div>
      )}
    </section>
  );
}
