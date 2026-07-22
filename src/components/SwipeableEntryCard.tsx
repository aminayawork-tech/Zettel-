'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { EntryCardContent, type EntryCardData } from '@/components/EntryCard';
import { MoreIcon } from '@/components/icons';
import { deleteEntry } from '@/app/actions/entries';

const ACTION_WIDTH = 144; // px — two 72px action buttons revealed on swipe-left

export default function SwipeableEntryCard({ entry }: { entry: EntryCardData }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [translateX, setTranslateX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [canSwipe, setCanSwipe] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const startXRef = useRef(0);
  const startTranslateRef = useRef(0);
  const draggedRef = useRef(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Swipe-to-reveal is a touch gesture — only enable it (and only ever show
  // the colored action strip) on coarse-pointer (touch) devices. Desktop uses
  // the three-dot menu instead; without this check the reveal strip could end
  // up visible/misaligned on mouse-driven layouts where nothing swiped it open.
  useEffect(() => {
    setCanSwipe(window.matchMedia('(pointer: coarse)').matches);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [menuOpen]);

  function onPointerDown(e: React.PointerEvent) {
    if (!canSwipe) return;
    startXRef.current = e.clientX;
    startTranslateRef.current = translateX;
    draggedRef.current = false;
    setDragging(true);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!canSwipe || !dragging) return;
    const delta = e.clientX - startXRef.current;
    if (Math.abs(delta) > 6) draggedRef.current = true;
    setTranslateX(Math.min(0, Math.max(-ACTION_WIDTH, startTranslateRef.current + delta)));
  }

  function endDrag() {
    if (!canSwipe) return;
    setDragging(false);
    setTranslateX((tx) => (tx < -ACTION_WIDTH / 2 ? -ACTION_WIDTH : 0));
  }

  function handleTap() {
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
    setMenuOpen(false);
    if (confirm('Delete this entry? This cannot be undone.')) {
      startTransition(() => deleteEntry(entry.id));
    }
  }

  function handleEdit(e: React.MouseEvent) {
    e.stopPropagation();
    setMenuOpen(false);
    router.push(`/entry/${entry.id}/edit`);
  }

  return (
    <div className="relative overflow-hidden rounded-lg">
      {canSwipe && (
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
      )}
      <div
        role="button"
        tabIndex={0}
        className="card p-4 hover:border-accent/50 hover:shadow-md transition-[border-color,box-shadow] bg-paper touch-pan-y cursor-pointer"
        style={
          canSwipe ? { transform: `translateX(${translateX}px)`, transition: dragging ? 'none' : 'transform 0.2s ease' } : undefined
        }
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClick={handleTap}
      >
        <EntryCardContent
          entry={entry}
          actions={
            <div className="relative" ref={menuRef}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen((v) => !v);
                }}
                aria-label="Entry actions"
                className="text-ink/30 hover:text-ink hover:bg-ink/5 rounded-full p-1"
              >
                <MoreIcon className="w-4 h-4" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-full mt-1 w-32 card shadow-lg py-1 z-10 text-sm">
                  {entry.type !== 'principle' && (
                    <button onClick={handleEdit} className="w-full text-left px-3 py-1.5 hover:bg-ink/5">
                      Edit
                    </button>
                  )}
                  <button disabled={pending} onClick={handleDelete} className="w-full text-left px-3 py-1.5 hover:bg-ink/5 text-red-600 disabled:opacity-60">
                    {pending ? 'Deleting…' : 'Delete'}
                  </button>
                </div>
              )}
            </div>
          }
        />
      </div>
    </div>
  );
}
