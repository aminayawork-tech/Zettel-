import Image from 'next/image';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { requireUser } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import type { RelationType } from '@/lib/enums';
import ConnectionsPanel from '@/components/ConnectionsPanel';
import QuestionsPanel from '@/components/QuestionsPanel';
import ShareDialog from '@/components/ShareDialog';
import EntryActions from '@/components/EntryActions';
import StillHoldsUp from '@/components/StillHoldsUp';
import ActionCheckbox from '@/components/ActionCheckbox';

const SOURCE_ICON: Record<string, string> = {
  book: '📖',
  podcast: '🎙️',
  video: '🎬',
  article: '📰',
  conversation: '💬',
  other: '✳️',
};

export default async function EntryPage({ params }: { params: { id: string } }) {
  const user = await requireUser();

  const entry = await prisma.entry.findUnique({
    where: { id: params.id },
    include: {
      takeaways: { include: { image: true }, orderBy: { position: 'asc' } },
      images: true,
      tags: { include: { tag: true } },
      questions: { orderBy: { createdAt: 'asc' } },
      linksFrom: { include: { toEntry: true } },
      linksTo: { include: { fromEntry: true } },
    },
  });

  if (!entry || entry.userId !== user.id) notFound();

  const otherEntries = await prisma.entry.findMany({
    where: { userId: user.id, id: { not: entry.id } },
    select: { id: true, sourceTitle: true, type: true },
    orderBy: { sourceTitle: 'asc' },
  });

  const circles = await prisma.circle.findMany({ where: { ownerId: user.id }, select: { id: true, name: true } });

  const entryImages = entry.images.filter((img) => img.field === 'entry');
  const isPrinciple = entry.type === 'principle';

  const confirmedLinks = entry.linksFrom.filter((l) => l.status === 'confirmed');
  const inboundLinks = entry.linksTo.filter((l) => l.status === 'confirmed');

  return (
    <div className="space-y-8 pb-16">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-ink/50">
            {isPrinciple ? (
              <span className="chip bg-moss/15 text-moss">Principle</span>
            ) : (
              <span>{SOURCE_ICON[entry.sourceType] || '✳️'} {entry.sourceType}</span>
            )}
            {entry.quickMode && <span className="chip bg-accent/10 text-accent">1-3-1</span>}
            <span>· {entry.createdAt.toLocaleDateString()}</span>
          </div>
          <h1 className="font-serif text-3xl font-bold mt-1">{entry.sourceTitle}</h1>
          {entry.sourceLink && (
            <a href={entry.sourceLink} target="_blank" rel="noreferrer" className="text-sm text-accent underline">
              {entry.sourceLink}
            </a>
          )}
        </div>
        <EntryActions entryId={entry.id} />
      </div>

      <section className="card p-6">
        <p className="label mb-1">Main idea</p>
        <p className="font-serif text-xl leading-snug">{entry.mainIdea}</p>
      </section>

      {entryImages.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {entryImages.map((img) => (
            <div key={img.id} className="w-40">
              <Image src={img.url} alt={img.aiDescription || ''} width={img.width || 320} height={img.height || 320} className="rounded-lg border border-ink/10 object-cover w-40 h-40" />
              {img.aiDescription && <p className="text-xs text-ink/50 mt-1">{img.aiDescription}</p>}
            </div>
          ))}
        </div>
      )}

      {entry.takeaways.length > 0 && (
        <section className="card p-6">
          <p className="label mb-2">Key takeaways</p>
          <ul className="space-y-3">
            {entry.takeaways.map((t, i) => (
              <li key={t.id} className="flex gap-3">
                <span className="text-ink/30 font-serif">{i + 1}.</span>
                <div>
                  <p>{t.text}</p>
                  {t.image && (
                    <Image src={t.image.url} alt="" width={t.image.width || 120} height={t.image.height || 120} className="rounded-md border border-ink/10 object-cover w-24 h-24 mt-1" />
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        {entry.surprise && (
          <section className="card p-5">
            <p className="label mb-1">What surprised me</p>
            <p className="text-sm">{entry.surprise}</p>
          </section>
        )}
        {entry.whyItMatters && (
          <section className="card p-5">
            <p className="label mb-1">Why it matters</p>
            <p className="text-sm">{entry.whyItMatters}</p>
          </section>
        )}
      </div>

      {entry.explanation && (
        <section className="card p-5">
          <p className="label mb-1">Plain English (Feynman test)</p>
          <p className="text-sm italic">{entry.explanation}</p>
        </section>
      )}

      {entry.quote && (
        <section className="card p-5 border-l-4 border-l-accent">
          <p className="label mb-1">Worth remembering</p>
          <p className="font-serif text-lg">&ldquo;{entry.quote}&rdquo;</p>
          {entry.images.find((i) => i.field === 'quote') && (
            <Image
              src={entry.images.find((i) => i.field === 'quote')!.url}
              alt=""
              width={100}
              height={100}
              className="rounded-md border border-ink/10 object-cover w-24 h-24 mt-2"
            />
          )}
        </section>
      )}

      {entry.action && (
        <section className="card p-5 bg-moss/5 border-moss/20 flex items-center justify-between gap-4">
          <div>
            <p className="label mb-1 text-moss">This week&apos;s action</p>
            <p className={`text-sm ${entry.actionDone ? 'line-through text-ink/40' : ''}`}>{entry.action}</p>
          </div>
          <ActionCheckbox entryId={entry.id} done={entry.actionDone} />
        </section>
      )}

      {entry.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {entry.tags.map((t) => (
            <span key={t.tag.name} className="chip bg-ink/5 text-ink/60">
              #{t.tag.name}
            </span>
          ))}
        </div>
      )}

      <StillHoldsUp entryId={entry.id} stillHoldsUp={entry.stillHoldsUp} lastRatedAt={entry.lastRatedAt} />

      <ConnectionsPanel
        entryId={entry.id}
        linksFrom={entry.linksFrom.map((l) => ({
          id: l.id,
          status: l.status,
          relationType: l.relationType as RelationType,
          aiSuggested: l.aiSuggested,
          aiRationale: l.aiRationale,
          other: { id: l.toEntry.id, title: l.toEntry.sourceTitle, type: l.toEntry.type },
        }))}
        linksTo={inboundLinks.map((l) => ({
          id: l.id,
          relationType: l.relationType as RelationType,
          other: { id: l.fromEntry.id, title: l.fromEntry.sourceTitle, type: l.fromEntry.type },
        }))}
        otherEntries={otherEntries}
      />

      {confirmedLinks.length >= 2 && !isPrinciple && (
        <PromotePrompt entryId={entry.id} linkedTitles={confirmedLinks.map((l) => l.toEntry.sourceTitle)} />
      )}

      <QuestionsPanel entryId={entry.id} questions={entry.questions} otherEntries={otherEntries} />

      <ShareDialog entry={{ id: entry.id, sourceTitle: entry.sourceTitle, mainIdea: entry.mainIdea, quote: entry.quote }} circles={circles} takeaways={entry.takeaways.map((t) => t.text)} />

      <div className="text-xs text-ink/40">
        <Link href={`/graph?focus=${entry.id}`} className="underline hover:text-accent">
          See this entry in the graph →
        </Link>
      </div>
    </div>
  );
}

function PromotePrompt({ entryId, linkedTitles }: { entryId: string; linkedTitles: string[] }) {
  return (
    <section className="card p-5 bg-accent/5 border-accent/20">
      <p className="text-sm">
        This entry now connects to {linkedTitles.length} others ({linkedTitles.slice(0, 3).join(', ')}
        {linkedTitles.length > 3 ? '…' : ''}). Notice a recurring pattern?
      </p>
      <Link href={`/journal/new-principle?from=${entryId}`} className="btn-secondary mt-3 inline-block text-sm">
        Promote to a Principle →
      </Link>
    </section>
  );
}
