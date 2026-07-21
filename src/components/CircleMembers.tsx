'use client';

import { useState, useTransition } from 'react';
import { addMemberByEmail, removeMember } from '@/app/actions/circles';

export default function CircleMembers({
  circleId,
  isOwner,
  members,
}: {
  circleId: string;
  isOwner: boolean;
  members: { id: string; name: string; email: string }[];
}) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleAdd() {
    setError(null);
    startTransition(async () => {
      try {
        await addMemberByEmail(circleId, email);
        setEmail('');
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not add member.');
      }
    });
  }

  return (
    <section className="card p-5 space-y-3">
      <h2 className="font-serif text-lg font-semibold">Members</h2>
      <div className="space-y-2">
        {members.map((m) => (
          <div key={m.id} className="flex items-center justify-between text-sm border border-ink/10 rounded-md px-3 py-2">
            <span>
              {m.name} <span className="text-ink/40">({m.email})</span>
            </span>
            {isOwner && (
              <button className="text-ink/30 hover:text-red-600 text-xs" onClick={() => startTransition(() => removeMember(circleId, m.id))}>
                Remove
              </button>
            )}
          </div>
        ))}
      </div>

      {isOwner && (
        <div className="pt-2 border-t border-ink/10">
          <p className="label mb-2">Add a member by email</p>
          <div className="flex gap-2">
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="friend@example.com" />
            <button disabled={!email || pending} className="btn-secondary whitespace-nowrap" onClick={handleAdd}>
              Add
            </button>
          </div>
          <p className="text-xs text-ink/40 mt-1">They need a Zettel account already.</p>
          {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
        </div>
      )}
    </section>
  );
}
