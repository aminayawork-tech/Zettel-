'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { MoreIcon } from '@/components/icons';
import { deleteEntry } from '@/app/actions/entries';

export default function EntryPageMenu({ entryId, isPrinciple }: { entryId: string; isPrinciple: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  function handleDelete() {
    setOpen(false);
    if (confirm('Delete this entry? This cannot be undone.')) {
      startTransition(() => deleteEntry(entryId));
    }
  }

  return (
    <div className="relative shrink-0" ref={menuRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Entry actions"
        className="text-ink/40 hover:text-ink hover:bg-ink/5 rounded-full p-1.5"
      >
        <MoreIcon className="w-5 h-5" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-32 card shadow-lg py-1 z-10 text-sm">
          {!isPrinciple && (
            <button onClick={() => router.push(`/entry/${entryId}/edit`)} className="w-full text-left px-3 py-1.5 hover:bg-ink/5">
              Edit
            </button>
          )}
          <button disabled={pending} onClick={handleDelete} className="w-full text-left px-3 py-1.5 hover:bg-ink/5 text-red-600 disabled:opacity-60">
            {pending ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      )}
    </div>
  );
}
