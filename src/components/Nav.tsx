import Link from 'next/link';
import { getCurrentUser } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import NavMenu from '@/components/NavMenu';

export default async function Nav() {
  const user = await getCurrentUser();
  if (!user) return null;

  const openQuestionCount = await prisma.question.count({ where: { userId: user.id, status: 'open' } });

  const links = [
    { href: '/journal', label: 'Journal' },
    { href: '/journal/new', label: 'New Entry' },
    { href: '/calendar', label: 'Calendar' },
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
        <NavMenu links={links} openQuestionCount={openQuestionCount} userName={user.name || ''} />
      </div>
    </header>
  );
}
