'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';

interface NavLink {
  href: string;
  label: string;
}

export default function NavMenu({
  links,
  openQuestionCount,
  userName,
}: {
  links: NavLink[];
  openQuestionCount: number;
  userName: string;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  function Badge({ href }: { href: string }) {
    if (href !== '/digest' || openQuestionCount === 0) return null;
    return <span className="ml-1.5 chip bg-accent/15 text-accent">{openQuestionCount}</span>;
  }

  return (
    <>
      {/* Desktop: inline links */}
      <nav className="hidden md:flex items-center gap-1 text-sm flex-wrap">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className={`btn-ghost relative ${pathname === l.href ? 'bg-ink/5 text-ink' : ''}`}>
            {l.label}
            <Badge href={l.href} />
          </Link>
        ))}
      </nav>
      <div className="hidden md:flex items-center gap-2 text-sm text-ink/60">
        <span>{userName}</span>
        <button className="btn-ghost" onClick={() => signOut({ callbackUrl: '/login' })}>
          Sign out
        </button>
      </div>

      {/* Mobile: hamburger + dropdown */}
      <div className="md:hidden relative" ref={panelRef}>
        <button
          className="btn-ghost px-2 relative"
          aria-label="Menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
          {openQuestionCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-accent" />
          )}
        </button>

        {open && (
          <div className="absolute right-0 top-full mt-2 w-56 card shadow-lg py-2 z-40">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`flex items-center justify-between px-4 py-2.5 text-sm hover:bg-ink/5 ${pathname === l.href ? 'text-accent font-medium' : ''}`}
              >
                {l.label}
                <Badge href={l.href} />
              </Link>
            ))}
            <div className="border-t border-ink/10 mt-2 pt-2 px-4 flex items-center justify-between text-sm text-ink/60">
              <span>{userName}</span>
              <button className="text-ink/60 hover:text-ink" onClick={() => signOut({ callbackUrl: '/login' })}>
                Sign out
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
