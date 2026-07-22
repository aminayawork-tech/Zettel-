'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { EntryCardContent, type EntryCardData } from '@/components/EntryCard';
import { deleteEntry } from '@/app/actions/entries';

const ACTION_WIDTH = 144; // px — two 72px action buttons revealed on swipe-left

export default function SwipeableEntryCard({ entry }: { entry: EntryCardData }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [translateX, setTranslateX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startXRef = useRef(0);
  const startTranslateRef = useRef(0);
  const draggedRef = useRef(false);

  function onPointerDown(e: React.PointerEvent) {
    startXRef.current = e.clientX;
    startTranslateRef.current = translateX;
    draggedRef.current = false;
    setDragging(true);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragging) return;
    const delta = e.clientX - startXRef.current;
    if (Math.abs(delta) > 6) draggedRef.current = true;
    setTranslateX(Math.min(0, Math.max(-ACTION_WIDTH, startTranslateRef.current + delta)));
  }

  function endDrag() {
    setDragging(false);
    setTranslateX((tx) => (tx < -ACTION_WIDTH / 2 ? -ACTION_WIDTH : 0));
  }

  function handleTap(e: React.MouseEvent) {
    if (draggedRef.current) {
      draggedRef.current = false;
      return;
    }
    if (translateX !== 0) {
      setTranslateX(0);
      return;
    }
    router.push(`/entry/${entry.id}`);
  }

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    if (confirm('Delete this entry? This cannot be undone.')) {
      startTransition(() => deleteEntry(entry.id));
    }
  }

  function handleEdit(e: React.MouseEvent) {
    e.stopPropagation();
    router.push(`/entry/${entry.id}/edit`);
  }

  return (
    <div className="relative overflow-hidden rounded-lg">
      <div className="absolute inset-y-0 right-0 flex" style={{ width: ACTION_WIDTH }}>
        {entry.type !== 'principle' && (
          <button
            onClick={handleEdit}
            className="w-[72px] bg-ink text-paper text-xs font-medium flex items-center justify-center"
          >
            Edit
          </button>
        )}
        <button
          disabled={pending}
          onClick={handleDelete}
          className="w-[72px] bg-red-600 text-paper text-xs font-medium flex items-center justify-center disabled:opacity-60"
        >
          {pending ? '…' : 'Delete'}
        </button>
      </div>
      <div
        role="button"
        tabIndex={0}
        className="card p-4 hover:border-accent/50 hover:shadow-md transition-[border-color,box-shadow] bg-paper touch-pan-y cursor-pointer"
        style={{
          transform: `translateX(${translateX}px)`,
          transition: dragging ? 'none' : 'transform 0.2s ease',
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClick={handleTap}
      >
        <EntryCardContent entry={entry} />
      </div>
    </div>
  );
}
