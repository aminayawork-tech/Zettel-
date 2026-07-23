'use client';

import { useState, useTransition } from 'react';
import {
  acceptAiQuestion,
  dismissAiQuestion,
  markQuestionAnswered,
  reopenQuestion,
  linkQuestionToFollowup,
  addQuestionFollowup,
} from '@/app/actions/questions';
import { timeAgo } from '@/lib/utils';

interface FollowupData {
  id: string;
  text: string;
  createdAt: Date;
}

interface QuestionData {
  id: string;
  text: string;
  origin: string;
  accepted: boolean;
  status: string;
  answerEntryId: string | null;
  followups: FollowupData[];
}

export default function QuestionsPanel({
  entryId,
  questions,
  otherEntries,
}: {
  entryId: string;
  questions: QuestionData[];
  otherEntries: { id: string; sourceTitle: string; type: string }[];
}) {
  const [pending, startTransition] = useTransition();
  const pendingAi = questions.filter((q) => !q.accepted);
  const accepted = questions.filter((q) => q.accepted);

  if (questions.length === 0) return null;

  return (
    <section className="card p-5 space-y-4">
      <h2 className="font-serif text-lg font-semibold">Open questions</h2>

      {pendingAi.length > 0 && (
        <div className="space-y-2">
          <p className="label">Zettel suggests</p>
          {pendingAi.map((q) => (
            <div key={q.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border border-accent/30 bg-accent/5 rounded-md px-3 py-2 text-sm">
              <span className="min-w-0">{q.text}</span>
              <div className="flex gap-1 shrink-0">
                <button disabled={pending} className="btn-secondary text-xs py-1" onClick={() => startTransition(() => acceptAiQuestion(q.id))}>
                  Accept
                </button>
                <button disabled={pending} className="btn-ghost text-xs py-1" onClick={() => startTransition(() => dismissAiQuestion(q.id))}>
                  Dismiss
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {accepted.length > 0 && (
        <div className="space-y-2">
          {accepted.map((q) => (
            <QuestionRow key={q.id} question={q} otherEntries={otherEntries} pending={pending} startTransition={startTransition} />
          ))}
        </div>
      )}
    </section>
  );
}

function QuestionRow({
  question,
  otherEntries,
  pending,
  startTransition,
}: {
  question: QuestionData;
  otherEntries: { id: string; sourceTitle: string; type: string }[];
  pending: boolean;
  startTransition: React.TransitionStartFunction;
}) {
  const [replying, setReplying] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [linking, setLinking] = useState(false);
  const [followupId, setFollowupId] = useState('');
  const answered = question.status === 'answered';

  function submitReply() {
    if (!replyText.trim()) return;
    startTransition(() => addQuestionFollowup(question.id, replyText));
    setReplyText('');
    setReplying(false);
  }

  return (
    <div className="border border-ink/10 rounded-md px-3 py-2 text-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <span className={`min-w-0 ${answered ? 'line-through text-ink/40' : ''}`}>
          {question.text} {question.origin === 'ai' && <span className="chip bg-ink/5 text-ink/40 text-[10px] ml-1">AI</span>}
        </span>
        <div className="flex gap-1 shrink-0">
          {answered ? (
            <button disabled={pending} className="btn-ghost text-xs py-1" onClick={() => startTransition(() => reopenQuestion(question.id))}>
              Reopen
            </button>
          ) : (
            <>
              <button disabled={pending} className="btn-secondary text-xs py-1" onClick={() => setReplying(!replying)}>
                Follow up
              </button>
              <button disabled={pending} className="btn-ghost text-xs py-1" onClick={() => startTransition(() => markQuestionAnswered(question.id))}>
                Resolve
              </button>
            </>
          )}
        </div>
      </div>

      {question.followups.length > 0 && (
        <div className="mt-2 pl-3 border-l-2 border-ink/10 space-y-2">
          {question.followups.map((f) => (
            <div key={f.id}>
              <p>{f.text}</p>
              <p className="text-xs text-ink/40">{timeAgo(f.createdAt)}</p>
            </div>
          ))}
        </div>
      )}

      {replying && (
        <div className="mt-2 space-y-2">
          <textarea
            className="input text-sm"
            rows={2}
            autoFocus
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Add your thinking, then keep going next time you revisit this…"
          />
          <div className="flex gap-2">
            <button disabled={!replyText.trim() || pending} className="btn-secondary text-xs py-1" onClick={submitReply}>
              Post
            </button>
            <button className="btn-ghost text-xs py-1" onClick={() => setReplying(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {!answered && otherEntries.length > 0 && (
        <div className="mt-2">
          {linking ? (
            <div className="flex flex-col sm:flex-row gap-2">
              <select className="input text-xs py-1 min-w-0 flex-1" value={followupId} onChange={(e) => setFollowupId(e.target.value)}>
                <option value="">Choose the entry that answers this…</option>
                {otherEntries.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.sourceTitle}
                  </option>
                ))}
              </select>
              <button
                disabled={!followupId || pending}
                className="btn-secondary text-xs shrink-0"
                onClick={() => {
                  startTransition(() => linkQuestionToFollowup(question.id, followupId));
                  setLinking(false);
                }}
              >
                Link
              </button>
            </div>
          ) : (
            <button className="text-xs text-ink/40 hover:text-ink underline" onClick={() => setLinking(true)}>
              or link an existing entry as the answer
            </button>
          )}
        </div>
      )}
    </div>
  );
}
