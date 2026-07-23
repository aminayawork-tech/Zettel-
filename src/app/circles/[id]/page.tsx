import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import CircleMembers from '@/components/CircleMembers';
import CircleActions from '@/components/CircleActions';

export default async function CirclePage({ params }: { params: { id: string } }) {
  const user = await requireUser();

  const circle = await prisma.circle.findUnique({
    where: { id: params.id },
    include: { members: { include: { user: true } }, owner: true },
  });

  if (!circle) notFound();
  const isOwner = circle.ownerId === user.id;
  const isMember = circle.members.some((m) => m.userId === user.id);
  if (!isOwner && !isMember) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl font-bold">{circle.name}</h1>
          <p className="text-ink/60 text-sm">Owned by {circle.owner.name}</p>
        </div>
        {isOwner && <CircleActions circleId={circle.id} circleName={circle.name} />}
      </div>

      <CircleMembers
        circleId={circle.id}
        isOwner={isOwner}
        members={circle.members.map((m) => ({ id: m.userId, name: m.user.name, email: m.user.email }))}
      />
    </div>
  );
}
