import { prisma } from '@/lib/prisma';

const RESURFACE_COUNT = 2;
const RESURFACE_MIN_AGE_DAYS = 14;

export async function getDigest(userId: string) {
  const [openQuestions, pendingConnections, unfollowedActions] = await Promise.all([
    prisma.question.findMany({
      where: { userId, status: 'open', accepted: true },
      include: { sourceEntry: { select: { id: true, sourceTitle: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.link.findMany({
      where: { status: 'suggested', aiSuggested: true, fromEntry: { userId } },
      include: {
        fromEntry: { select: { id: true, sourceTitle: true } },
        toEntry: { select: { id: true, sourceTitle: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.entry.findMany({
      where: { userId, action: { not: null }, actionDone: false },
      select: { id: true, sourceTitle: true, action: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const cutoff = new Date(Date.now() - RESURFACE_MIN_AGE_DAYS * 24 * 60 * 60 * 1000);
  const resurfaceCandidates = await prisma.entry.findMany({
    where: {
      userId,
      type: 'source_entry',
      createdAt: { lt: cutoff },
      OR: [{ lastRatedAt: null }, { lastRatedAt: { lt: cutoff } }],
    },
    select: { id: true, sourceTitle: true, mainIdea: true, stillHoldsUp: true, lastRatedAt: true },
  });

  const shuffled = [...resurfaceCandidates].sort(() => Math.random() - 0.5);
  const resurfaced = shuffled.slice(0, RESURFACE_COUNT);

  return { openQuestions, pendingConnections, unfollowedActions, resurfaced };
}
