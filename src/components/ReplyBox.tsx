'use client';

import { useState, useTransition } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { addReply } from '@/app/actions/share';

export default function ReplyBox({ token }: { token: string }) {
  const { data: session, status } = useSession();
  const [text, setText] = useState('');
  const [pending, startTransition] = useTransition();

  if (status === 'loading') return null;

  if (!session) {
    return (
      <p className="text-sm text-ink/50">
        <Link href="/login" className="text-accent underline">
          Sign in
        </Link>{' '}
        to reply with your own reflection.
      </p>
    );
  }

  return (
    <div className="flex gap-2">
      <input
        className="input"
        placeholder="Add a short reflection…"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button
        disabled={!text.trim() || pending}
        className="btn-secondary whitespace-nowrap"
        onClick={() =>
          startTransition(async () => {
            await addReply(token, text);
            setText('');
          })
        }
      >
        Reply
      </button>
    </div>
  );
}
