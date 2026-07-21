'use client';

import { useState, useTransition } from 'react';
import { promoteToPrinciple } from '@/app/actions/entries';
import { LIMITS } from '@/lib/enums';

export default function PrincipleForm({
  entries,
  preselected,
}: {
  entries: { id: string; sourceTitle: string; mainIdea: string }[];
  preselected: string[];
}) {
  const [title, setTitle] = useState('');
  const [statement, setStatement] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set(preselected));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function toggle(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  }

  function handleSubmit() {
    setError(null);
    if (!title.trim() || !statement.trim()) {
      setError('Give the principle a name and a statement.');
      return;
    }
    startTransition(async () => {
      try {
        await promoteToPrinciple({ title, statement, fromEntryIds: Array.from(selected) });
      } catch (e) {
        const digest = (e as { digest?: string })?.digest;
        if (digest?.startsWith('NEXT_REDIRECT')) throw e;
        setError(e instanceof Error ? e.message : 'Something went wrong.');
      }
    });
  }

  return (
    <div className="space-y-5">
      <div className="card p-5 space-y-3">
        <div>
          <label className="label">Name</label>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Adoption follows affordability, not novelty" />
        </div>
        <div>
          <label className="label">Statement</label>
          <textarea
            className="input"
            rows={2}
            maxLength={LIMITS.mainIdea}
            value={statement}
            onChange={(e) => setStatement(e.target.value)}
          />
        </div>
      </div>

      <div className="card p-5">
        <p className="label mb-2">Entries that exemplify this principle</p>
        <div className="space-y-1 max-h-72 overflow-y-auto">
          {entries.map((e) => (
            <label key={e.id} className="flex items-start gap-2 text-sm py-1 cursor-pointer">
              <input type="checkbox" className="mt-1" checked={selected.has(e.id)} onChange={() => toggle(e.id)} />
              <span>
                <span className="font-medium">{e.sourceTitle}</span>
                <span className="text-ink/50"> — {e.mainIdea}</span>
              </span>
            </label>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button disabled={pending} className="btn-primary" onClick={handleSubmit}>
        {pending ? 'Creating…' : 'Create principle'}
      </button>
    </div>
  );
}
