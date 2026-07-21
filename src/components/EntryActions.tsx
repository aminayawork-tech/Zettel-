'use client';

import { useTransition } from 'react';
import { deleteEntry } from '@/app/actions/entries';

export default function EntryActions({ entryId }: { entryId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      disabled={pending}
      className="btn-ghost text-xs text-ink/40 hover:text-red-600"
      onClick={() => {
        if (confirm('Delete this entry? This cannot be undone.')) {
          startTransition(() => deleteEntry(entryId));
        }
      }}
    >
      Delete
    </button>
  );
}
