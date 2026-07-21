'use client';

import { useTransition } from 'react';
import { toggleActionDone } from '@/app/actions/entries';

export default function ActionCheckbox({ entryId, done }: { entryId: string; done: boolean }) {
  const [pending, startTransition] = useTransition();

  return (
    <label className="flex items-center gap-2 text-xs text-moss cursor-pointer select-none">
      <input
        type="checkbox"
        checked={done}
        disabled={pending}
        onChange={(e) => startTransition(() => toggleActionDone(entryId, e.target.checked))}
      />
      {done ? 'Done' : 'Mark as done'}
    </label>
  );
}
