'use client';

import { useState } from 'react';
import { compressImage } from '@/lib/client-image';

export default function ImageSlot({
  label,
  onChange,
}: {
  label: string;
  onChange: (file: File | null) => void;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.files?.[0];
    if (!raw) return;
    setBusy(true);
    const compressed = await compressImage(raw);
    setBusy(false);
    setPreview(URL.createObjectURL(compressed));
    onChange(compressed);
  }

  function clear() {
    setPreview(null);
    onChange(null);
  }

  if (preview) {
    return (
      <div className="relative inline-block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={preview} alt="" className="h-16 w-16 object-cover rounded-md border border-ink/10" />
        <button
          type="button"
          onClick={clear}
          className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-ink text-paper text-xs leading-5"
          aria-label="Remove image"
        >
          ×
        </button>
      </div>
    );
  }

  return (
    <label className="inline-flex items-center gap-1.5 text-xs text-ink/50 hover:text-accent cursor-pointer">
      <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
      <span>{busy ? 'Compressing…' : `📷 ${label}`}</span>
    </label>
  );
}
