import Link from 'next/link';
import { timeAgo } from '@/lib/utils';

const SOURCE_ICON: Record<string, string> = {
  book: '📖',
  podcast: '🎙️',
  video: '🎬',
  article: '📰',
  conversation: '💬',
  other: '✳️',
};

export interface EntryCardData {
  id: string;
  type: string;
  sourceTitle: string;
  headline: string | null;
  sourceType: string;
  mainIdea: string;
  createdAt: Date;
  quickMode: boolean;
  tags: { tag: { name: string } }[];
  _count?: { takeaways: number; questions: number };
}

export function EntryCardContent({ entry }: { entry: EntryCardData }) {
  const isPrinciple = entry.type === 'principle';
  return (
    <>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 text-xs text-ink/50">
          {isPrinciple ? (
            <span className="chip bg-moss/15 text-moss">Principle</span>
          ) : (
            <span>{SOURCE_ICON[entry.sourceType] || '✳️'} {entry.sourceType}</span>
          )}
          {entry.quickMode && <span className="chip bg-accent/10 text-accent">1-3-1</span>}
        </div>
        <span className="text-xs text-ink/40 whitespace-nowrap">{timeAgo(entry.createdAt)}</span>
      </div>
      <h3 className="font-serif font-semibold text-lg mt-2">{entry.headline || entry.sourceTitle}</h3>
      {entry.headline && !isPrinciple && <p className="text-xs text-ink/40">{entry.sourceTitle}</p>}
      <p className="text-ink/80 text-sm mt-1 line-clamp-2">{entry.mainIdea}</p>
      {entry.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {entry.tags.map((t) => (
            <span key={t.tag.name} className="chip bg-ink/5 text-ink/60">
              #{t.tag.name}
            </span>
          ))}
        </div>
      )}
    </>
  );
}

export default function EntryCard({ entry }: { entry: EntryCardData }) {
  return (
    <Link href={`/entry/${entry.id}`} className="card block p-4 hover:border-accent/50 hover:shadow-md transition-all">
      <EntryCardContent entry={entry} />
    </Link>
  );
}
