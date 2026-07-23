'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { MoreIcon } from '@/components/icons';
import { deleteCircle } from '@/app/actions/circles';

export default function OwnedCircleCard({ circle }: { circle: { id: string; name: string; memberCount: number } }) {
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

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    setOpen(false);
    if (confirm(`Delete "${circle.name}"? Members will lose access, and anything shared to it will disappear from their feed (individual share links still open). This cannot be undone.`)) {
      startTransition(() => deleteCircle(circle.id));
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      className="card p-4 hover:border-accent/50 cursor-pointer relative"
      onClick={() => router.push(`/circles/${circle.id}`)}
    >
      <p className="font-medium pr-6">{circle.name}</p>
      <p className="text-xs text-ink/50 mt-1">
        {circle.memberCount} member{circle.memberCount === 1 ? '' : 's'}
      </p>
      <div className="absolute top-3 right-3" ref={menuRef}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setOpen((v) => !v);
          }}
          aria-label="Circle actions"
          className="text-ink/30 hover:text-ink hover:bg-ink/5 rounded-full p-1"
        >
          <MoreIcon className="w-4 h-4" />
        </button>
        {open && (
          <div className="absolute right-0 top-full mt-1 w-32 card shadow-lg py-1 z-10 text-sm">
            <button disabled={pending} onClick={handleDelete} className="w-full text-left px-3 py-1.5 hover:bg-ink/5 text-red-600 disabled:opacity-60">
              {pending ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
