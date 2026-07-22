// Small inline line icons (no external icon library) — kept minimal to match
// the app's editorial style. Every icon accepts a className for sizing/color
// via currentColor, defaulting to a compact inline size.

interface IconProps {
  className?: string;
}

const base = 'inline-block';

export function BookIcon({ className = `w-4 h-4 ${base}` }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
    </svg>
  );
}

export function MicIcon({ className = `w-4 h-4 ${base}` }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M5 10a7 7 0 0 0 14 0" />
      <line x1="12" y1="19" x2="12" y2="22" />
      <line x1="8" y1="22" x2="16" y2="22" />
    </svg>
  );
}

export function VideoIcon({ className = `w-4 h-4 ${base}` }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="2" y="5" width="14" height="14" rx="2" />
      <path d="M16 10.5 22 7v10l-6-3.5Z" />
    </svg>
  );
}

export function NewspaperIcon({ className = `w-4 h-4 ${base}` }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 4h13a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4Z" />
      <path d="M19 8h2v11a1 1 0 0 1-1 1h-1" />
      <line x1="7" y1="8" x2="13" y2="8" />
      <line x1="7" y1="12" x2="15" y2="12" />
      <line x1="7" y1="15" x2="15" y2="15" />
      <line x1="7" y1="18" x2="12" y2="18" />
    </svg>
  );
}

export function MessageIcon({ className = `w-4 h-4 ${base}` }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5A8.5 8.5 0 1 1 21 11.5Z" />
      <path d="M8 11h6M8 8h4" />
    </svg>
  );
}

export function DotIcon({ className = `w-4 h-4 ${base}` }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <circle cx="12" cy="12" r="4" />
    </svg>
  );
}

export function CameraIcon({ className = `w-4 h-4 ${base}` }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 8a2 2 0 0 1 2-2h1.2a1 1 0 0 0 .9-.55l.7-1.4A1 1 0 0 1 9.7 3.5h4.6a1 1 0 0 1 .9.55l.7 1.4a1 1 0 0 0 .9.55H18a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8Z" />
      <circle cx="12" cy="12.5" r="3.5" />
    </svg>
  );
}

export function SparklesIcon({ className = `w-4 h-4 ${base}` }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M11 2.5a1 1 0 0 1 1.9 0l1.1 3.2a4 4 0 0 0 2.3 2.3l3.2 1.1a1 1 0 0 1 0 1.9l-3.2 1.1a4 4 0 0 0-2.3 2.3l-1.1 3.2a1 1 0 0 1-1.9 0l-1.1-3.2a4 4 0 0 0-2.3-2.3l-3.2-1.1a1 1 0 0 1 0-1.9l3.2-1.1a4 4 0 0 0 2.3-2.3Z" />
      <path d="M19 2.5a.7.7 0 0 1 1.3 0l.4 1.1a1.5 1.5 0 0 0 .9.9l1.1.4a.7.7 0 0 1 0 1.3l-1.1.4a1.5 1.5 0 0 0-.9.9l-.4 1.1a.7.7 0 0 1-1.3 0l-.4-1.1a1.5 1.5 0 0 0-.9-.9l-1.1-.4a.7.7 0 0 1 0-1.3l1.1-.4a1.5 1.5 0 0 0 .9-.9Z" />
    </svg>
  );
}

export function XIcon({ className = `w-4 h-4 ${base}` }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

const SOURCE_ICONS: Record<string, (props: IconProps) => JSX.Element> = {
  book: BookIcon,
  podcast: MicIcon,
  video: VideoIcon,
  article: NewspaperIcon,
  conversation: MessageIcon,
  other: DotIcon,
};

export function SourceIcon({ type, className = `w-4 h-4 ${base}` }: { type: string } & IconProps) {
  const Icon = SOURCE_ICONS[type] || DotIcon;
  return <Icon className={className} />;
}
