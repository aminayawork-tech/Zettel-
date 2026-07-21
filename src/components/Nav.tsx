import Link from 'next/link';
import { getCurrentUser } from '@/lib/session';
import SignOutButton from '@/components/SignOutButton';
import { prisma } from '@/lib/prisma';

export default async function Nav() {
  const user = await getCurrentUser();
  if (!user) return null;

  const openQuestionCount = await prisma.question.count({ where: { userId: user.id, status: 'open' } });

  const links = [
    { href: '/journal', label: 'Journal' },
    { href: '/journal/new', label: 'New Entry' },
    { href: '/graph', label: 'Graph' },
    { href: '/feed', label: 'Feed' },
    { href: '/circles', label: 'Circles' },
    { href: '/digest', label: 'Digest' },
    { href: '/search', label: 'Search' },
  ];

  return (
    <header className="border-b border-ink/10 bg-paper/95 backdrop-blur sticky top-0 z-30">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <Link href="/journal" className="font-serif text-xl font-bold tracking-tight">
          Zettel
        </Link>
        <nav className="flex items-center gap-1 text-sm flex-wrap">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="btn-ghost relative">
              {l.label}
              {l.href === '/digest' && openQuestionCount > 0 && (
                <span className="ml-1.5 chip bg-accent/15 text-accent">{openQuestionCount}</span>
              )}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2 text-sm text-ink/60">
          <span className="hidden sm:inline">{user.name}</span>
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}
