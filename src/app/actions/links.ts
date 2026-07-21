'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import type { RelationType } from '@/lib/enums';

async function assertOwnsLink(linkId: string, userId: string) {
  const link = await prisma.link.findUnique({
    where: { id: linkId },
    include: { fromEntry: true },
  });
  if (!link || link.fromEntry.userId !== userId) throw new Error('Not found');
  return link;
}

export async function confirmLink(linkId: string, relationType: RelationType) {
  const user = await requireUser();
  const link = await assertOwnsLink(linkId, user.id);
  await prisma.link.update({ where: { id: link.id }, data: { status: 'confirmed', relationType } });
  revalidatePath(`/entry/${link.fromEntryId}`);
  revalidatePath('/graph');
}

export async function dismissLink(linkId: string) {
  const user = await requireUser();
  const link = await assertOwnsLink(linkId, user.id);
  await prisma.link.update({ where: { id: link.id }, data: { status: 'dismissed' } });
  revalidatePath(`/entry/${link.fromEntryId}`);
}

export async function createManualLink(fromEntryId: string, toEntryId: string, relationType: RelationType) {
  const user = await requireUser();
  const [from, to] = await Promise.all([
    prisma.entry.findUnique({ where: { id: fromEntryId } }),
    prisma.entry.findUnique({ where: { id: toEntryId } }),
  ]);
  if (!from || !to || from.userId !== user.id || to.userId !== user.id) throw new Error('Not found');
  if (fromEntryId === toEntryId) throw new Error('Cannot link an entry to itself.');

  await prisma.link.upsert({
    where: { fromEntryId_toEntryId_relationType: { fromEntryId, toEntryId, relationType } },
    update: { status: 'confirmed' },
    create: { fromEntryId, toEntryId, relationType, status: 'confirmed', aiSuggested: false },
  });
  revalidatePath(`/entry/${fromEntryId}`);
  revalidatePath('/graph');
}

export async function deleteLink(linkId: string) {
  const user = await requireUser();
  const link = await assertOwnsLink(linkId, user.id);
  await prisma.link.delete({ where: { id: link.id } });
  revalidatePath(`/entry/${link.fromEntryId}`);
  revalidatePath('/graph');
}
