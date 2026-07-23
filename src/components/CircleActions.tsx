'use client';

import { useTransition } from 'react';
import { deleteCircle } from '@/app/actions/circles';

export default function CircleActions({ circleId, circleName }: { circleId: string; circleName: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      disabled={pending}
      className="btn-ghost text-xs text-ink/40 hover:text-red-600"
      onClick={() => {
        if (confirm(`Delete "${circleName}"? Members will lose access, and anything shared to it will disappear from their feed (individual share links still open). This cannot be undone.`)) {
          startTransition(() => deleteCircle(circleId));
        }
      }}
    >
      {pending ? 'Deleting…' : 'Delete circle'}
    </button>
  );
}
