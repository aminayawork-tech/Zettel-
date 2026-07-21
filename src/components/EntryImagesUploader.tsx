'use client';

import { useState } from 'react';
import { compressImage } from '@/lib/client-image';

export default function EntryImagesUploader({ onChange }: { onChange: (files: File[]) => void }) {
  const [items, setItems] = useState<{ file: File; preview: string }[]>([]);
  const [busy, setBusy] = useState(false);

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = Array.from(e.target.files || []);
    if (raw.length === 0) return;
    setBusy(true);
    const compressed = await Promise.all(raw.map(compressImage));
    setBusy(false);
    const next = [...items, ...compressed.map((f) => ({ file: f, preview: URL.createObjectURL(f) }))];
    setItems(next);
    onChange(next.map((i) => i.file));
    e.target.value = '';
  }

  function remove(idx: number) {
    const next = items.filter((_, i) => i !== idx);
    setItems(next);
    onChange(next.map((i) => i.file));
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {items.map((item, idx) => (
          <div key={idx} className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.preview} alt="" className="h-20 w-20 object-cover rounded-md border border-ink/10" />
            <button
              type="button"
              onClick={() => remove(idx)}
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-ink text-paper text-xs leading-5"
              aria-label="Remove image"
            >
              ×
            </button>
          </div>
        ))}
        <label className="h-20 w-20 flex items-center justify-center rounded-md border-2 border-dashed border-ink/20 text-ink/40 hover:border-accent hover:text-accent cursor-pointer text-xs text-center px-1">
          <input type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />
          {busy ? 'Compressing…' : '+ Photo'}
        </label>
      </div>
      <p className="text-xs text-ink/40">A book page, whiteboard, screenshot, or handwritten note. We&apos;ll pull out any text automatically.</p>
    </div>
  );
}
