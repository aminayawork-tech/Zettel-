'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { confirmLink, dismissLink, createManualLink, deleteLink } from '@/app/actions/links';
import { RELATION_LABELS, RELATION_TYPES, type RelationType } from '@/lib/enums';

interface LinkedEntry {
  id: string;
  title: string;
  type: string;
}

interface OutLink {
  id: string;
  status: string;
  relationType: RelationType;
  aiSuggested: boolean;
  aiRationale: string | null;
  other: LinkedEntry;
}

interface InLink {
  id: string;
  relationType: RelationType;
  other: LinkedEntry;
}

export default function ConnectionsPanel({
  entryId,
  linksFrom,
  linksTo,
  otherEntries,
  isPrinciple,
}: {
  entryId: string;
  linksFrom: OutLink[];
  linksTo: InLink[];
  otherEntries: { id: string; sourceTitle: string; type: string }[];
  isPrinciple?: boolean;
}) {
  const suggested = linksFrom.filter((l) => l.status === 'suggested');
  const confirmed = linksFrom.filter((l) => l.status === 'confirmed');
  const [pending, startTransition] = useTransition();

  return (
    <section className="card p-5 space-y-4">
      <h2 className="font-serif text-lg font-semibold">Connections</h2>

      {suggested.length > 0 && (
        <div className="space-y-3">
          <p className="label">AI suggested — awaiting your review</p>
          {suggested.map((l) => (
            <SuggestedLinkRow key={l.id} link={l} pending={pending} startTransition={startTransition} />
          ))}
        </div>
      )}

      {confirmed.length > 0 && (
        <div className="space-y-2">
          <p className="label">Confirmed</p>
          {confirmed.map((l) => (
            <div key={l.id} className="flex flex-wrap items-center justify-between gap-2 text-sm border border-ink/10 rounded-md px-3 py-2">
              <span className="min-w-0">
                <span className="chip bg-moss/10 text-moss mr-2">{RELATION_LABELS[l.relationType]}</span>
                <Link href={`/entry/${l.other.id}`} className="hover:text-accent">
                  {l.other.title}
                </Link>
              </span>
              <button className="text-ink/30 hover:text-red-600 text-xs shrink-0" onClick={() => startTransition(() => deleteLink(l.id))}>
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      {linksTo.length > 0 && (
        <div className="space-y-2">
          <p className="label">{isPrinciple ? 'Entries that exemplify this principle' : 'Linked from'}</p>
          {linksTo.map((l) => (
            <div key={l.id} className="text-sm border border-ink/10 rounded-md px-3 py-2">
              <span className="chip bg-ink/5 text-ink/60 mr-2">{RELATION_LABELS[l.relationType]}</span>
              <Link href={`/entry/${l.other.id}`} className="hover:text-accent">
                {l.other.title}
              </Link>
            </div>
          ))}
        </div>
      )}

      {suggested.length === 0 && confirmed.length === 0 && linksTo.length === 0 && (
        <p className="text-sm text-ink/40">No connections yet.</p>
      )}

      <ManualLinkForm entryId={entryId} otherEntries={otherEntries} pending={pending} startTransition={startTransition} />
    </section>
  );
}

function SuggestedLinkRow({
  link,
  pending,
  startTransition,
}: {
  link: OutLink;
  pending: boolean;
  startTransition: React.TransitionStartFunction;
}) {
  const [relationType, setRelationType] = useState<RelationType>(link.relationType);

  return (
    <div className="border border-accent/30 bg-accent/5 rounded-md p-3 space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link href={`/entry/${link.other.id}`} className="font-medium text-sm hover:text-accent min-w-0">
          {link.other.title}
        </Link>
        <select
          className="text-xs border border-ink/20 rounded-md px-1.5 py-1 bg-white shrink-0"
          value={relationType}
          onChange={(e) => setRelationType(e.target.value as RelationType)}
        >
          {RELATION_TYPES.map((r) => (
            <option key={r} value={r}>
              {RELATION_LABELS[r]}
            </option>
          ))}
        </select>
      </div>
      {link.aiRationale && <p className="text-xs text-ink/60 italic">&ldquo;{link.aiRationale}&rdquo;</p>}
      <div className="flex gap-2">
        <button
          disabled={pending}
          className="btn-secondary text-xs py-1"
          onClick={() => startTransition(() => confirmLink(link.id, relationType))}
        >
          Confirm
        </button>
        <button
          disabled={pending}
          className="btn-ghost text-xs py-1"
          onClick={() => startTransition(() => dismissLink(link.id))}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}

function ManualLinkForm({
  entryId,
  otherEntries,
  pending,
  startTransition,
}: {
  entryId: string;
  otherEntries: { id: string; sourceTitle: string; type: string }[];
  pending: boolean;
  startTransition: React.TransitionStartFunction;
}) {
  const [targetId, setTargetId] = useState('');
  const [relationType, setRelationType] = useState<RelationType>('reminds_me_of');

  if (otherEntries.length === 0) return null;

  return (
    <div className="pt-2 border-t border-ink/10">
      <p className="label mb-2">Tag a connection manually</p>
      <div className="flex flex-wrap gap-2">
        <select className="input text-sm flex-1 min-w-0" value={targetId} onChange={(e) => setTargetId(e.target.value)}>
          <option value="">Choose an entry…</option>
          {otherEntries.map((e) => (
            <option key={e.id} value={e.id}>
              {e.type === 'principle' ? '◆ ' : ''}
              {e.sourceTitle}
            </option>
          ))}
        </select>
        <select className="input text-sm w-auto" value={relationType} onChange={(e) => setRelationType(e.target.value as RelationType)}>
          {RELATION_TYPES.map((r) => (
            <option key={r} value={r}>
              {RELATION_LABELS[r]}
            </option>
          ))}
        </select>
        <button
          disabled={!targetId || pending}
          className="btn-secondary text-sm"
          onClick={() => {
            startTransition(() => createManualLink(entryId, targetId, relationType));
            setTargetId('');
          }}
        >
          Link
        </button>
      </div>
    </div>
  );
}
