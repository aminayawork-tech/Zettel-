import Link from 'next/link';
import { requireUser } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { createCircle } from '@/app/actions/circles';

export default async function CirclesPage() {
  const user = await requireUser();

  const owned = await prisma.circle.findMany({
    where: { ownerId: user.id },
    include: { members: true },
    orderBy: { createdAt: 'desc' },
  });

  const memberOf = await prisma.circle.findMany({
    where: { members: { some: { userId: user.id } }, ownerId: { not: user.id } },
    include: { owner: true, members: true },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-bold mb-1">Circles</h1>
        <p className="text-ink/60 text-sm">Small private groups you share with — Family, Book Club, whoever you trust with your notebook.</p>
      </div>

      <form action={createCircle} className="card p-4 flex gap-2">
        <input name="name" required placeholder="Circle name, e.g. Book Club" className="input" />
        <button type="submit" className="btn-primary whitespace-nowrap">
          Create circle
        </button>
      </form>

      <div>
        <h2 className="font-serif text-lg font-semibold mb-3">Your circles</h2>
        {owned.length === 0 ? (
          <p className="text-sm text-ink/50">You haven&apos;t created a circle yet.</p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {owned.map((c) => (
              <Link key={c.id} href={`/circles/${c.id}`} className="card p-4 hover:border-accent/50">
                <p className="font-medium">{c.name}</p>
                <p className="text-xs text-ink/50 mt-1">{c.members.length} member{c.members.length === 1 ? '' : 's'}</p>
              </Link>
            ))}
          </div>
        )}
      </div>

      {memberOf.length > 0 && (
        <div>
          <h2 className="font-serif text-lg font-semibold mb-3">Circles you&apos;re in</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {memberOf.map((c) => (
              <div key={c.id} className="card p-4">
                <p className="font-medium">{c.name}</p>
                <p className="text-xs text-ink/50 mt-1">Owned by {c.owner.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
