'use server';

import { revalidatePath } from 'next/cache';
import { v4 as uuid } from 'uuid';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import type { ShareScope } from '@/lib/enums';

export async function shareEntry(input: {
  entryId: string;
  scope: ShareScope;
  snippet?: string;
  circleId?: string | null;
}) {
  const user = await requireUser();
  const entry = await prisma.entry.findUnique({ where: { id: input.entryId } });
  if (!entry || entry.userId !== user.id) throw new Error('Not found');

  if (input.circleId) {
    const circle = await prisma.circle.findUnique({ where: { id: input.circleId } });
    if (!circle || circle.ownerId !== user.id) throw new Error('Circle not found');
  }

  const shareEvent = await prisma.shareEvent.create({
    data: {
      entryId: input.entryId,
      ownerId: user.id,
      scope: input.scope,
      snippet: input.snippet || null,
      circleId: input.circleId || null,
      token: uuid(),
    },
  });

  await prisma.entry.update({
    where: { id: input.entryId },
    data: { visibility: input.circleId ? 'circle' : 'shared' },
  });

  revalidatePath(`/entry/${input.entryId}`);
  revalidatePath('/feed');
  return shareEvent.token;
}

export async function addReply(token: string, text: string) {
  const user = await requireUser();
  if (!text.trim()) throw new Error('Reply cannot be empty.');
  const shareEvent = await prisma.shareEvent.findUnique({ where: { token } });
  if (!shareEvent) throw new Error('Not found');
  await prisma.reply.create({
    data: { shareEventId: shareEvent.id, userId: user.id, text: text.trim().slice(0, 1000) },
  });
  revalidatePath(`/s/${token}`);
  revalidatePath('/feed');
}
