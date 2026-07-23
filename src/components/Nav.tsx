import Link from 'next/link';
import { getCurrentUser } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import NavMenu from '@/components/NavMenu';
import MobileTabBar from '@/components/MobileTabBar';

// Journal / Calendar / New Entry / Digest / Feed live in the mobile bottom tab
// bar (and, on desktop, the inline bar below) — Graph/Circles/Search are less
// frequent, so on mobile they're tucked behind the hamburger only.
const ALL_LINKS = [
  { href: '/journal', label: 'Journal' },
  { href: '/journal/new', label: 'New Entry' },
  { href: '/calendar', label: 'Calendar' },
  { href: '/graph', label: 'Graph' },
  { href: '/feed', label: 'Feed' },
  { href: '/circles', label: 'Circles' },
  { href: '/digest', label: 'Digest' },
  { href: '/search', label: 'Search' },
];

const MOBILE_MENU_HREFS = new Set(['/graph', '/circles', '/search']);

export default async function Nav() {
  const user = await getCurrentUser();
  if (!user) return null;

  const openQuestionCount = await prisma.question.count({ where: { userId: user.id, status: 'open' } });
  const mobileLinks = ALL_LINKS.filter((l) => MOBILE_MENU_HREFS.has(l.href));

  return (
    <>
      <header className="border-b border-ink/10 bg-paper/95 backdrop-blur sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Link href="/journal" className="font-serif text-xl font-bold tracking-tight">
            Zettel
          </Link>
          <NavMenu links={ALL_LINKS} mobileLinks={mobileLinks} openQuestionCount={openQuestionCount} userName={user.name || ''} />
        </div>
      </header>
      <MobileTabBar openQuestionCount={openQuestionCount} />
    </>
  );
}
