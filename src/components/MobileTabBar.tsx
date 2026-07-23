'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HomeIcon, CalendarIcon, PlusIcon, ListChecksIcon, UsersIcon } from '@/components/icons';

const TABS = [
  { href: '/journal', label: 'Journal', Icon: HomeIcon, primary: false },
  { href: '/calendar', label: 'Calendar', Icon: CalendarIcon, primary: false },
  { href: '/journal/new', label: 'New', Icon: PlusIcon, primary: true },
  { href: '/digest', label: 'Digest', Icon: ListChecksIcon, primary: false },
  { href: '/feed', label: 'Feed', Icon: UsersIcon, primary: false },
] as const;

export default function MobileTabBar({ openQuestionCount }: { openQuestionCount: number }) {
  const pathname = usePathname();

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-ink border-t border-white/10"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-stretch justify-around">
        {TABS.map((tab) => {
          const active = pathname === tab.href;

          if (tab.primary) {
            return (
              <Link key={tab.href} href={tab.href} className="flex-1 flex flex-col items-center justify-end pb-1.5 relative">
                <span className="absolute -top-4 h-12 w-12 rounded-full bg-accent text-paper flex items-center justify-center shadow-lg ring-4 ring-ink">
                  <tab.Icon className="w-6 h-6" />
                </span>
                <span className="text-[10px] mt-8 text-paper/70">{tab.label}</span>
              </Link>
            );
          }

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 ${active ? 'text-paper' : 'text-paper/50'}`}
            >
              <span className="relative">
                <tab.Icon className="w-5 h-5" />
                {tab.href === '/digest' && openQuestionCount > 0 && (
                  <span className="absolute -top-0.5 -right-1.5 h-1.5 w-1.5 rounded-full bg-accent" />
                )}
              </span>
              <span className="text-[10px]">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
