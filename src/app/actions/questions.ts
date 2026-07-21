'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';

async function assertOwnsQuestion(questionId: string, userId: string) {
  const q = await prisma.question.findUnique({ where: { id: questionId } });
  if (!q || q.userId !== userId) throw new Error('Not found');
  return q;
}

export async function acceptAiQuestion(questionId: string) {
  const user = await requireUser();
  const q = await assertOwnsQuestion(questionId, user.id);
  await prisma.question.update({ where: { id: questionId }, data: { accepted: true } });
  revalidatePath('/digest');
  revalidatePath(`/entry/${q.sourceEntryId}`);
}

export async function dismissAiQuestion(questionId: string) {
  const user = await requireUser();
  const q = await assertOwnsQuestion(questionId, user.id);
  await prisma.question.delete({ where: { id: questionId } });
  revalidatePath(`/entry/${q.sourceEntryId}`);
}

export async function markQuestionAnswered(questionId: string) {
  const user = await requireUser();
  await assertOwnsQuestion(questionId, user.id);
  await prisma.question.update({
    where: { id: questionId },
    data: { status: 'answered', resolvedAt: new Date() },
  });
  revalidatePath('/digest');
  revalidatePath('/journal');
}

export async function reopenQuestion(questionId: string) {
  const user = await requireUser();
  await assertOwnsQuestion(questionId, user.id);
  await prisma.question.update({
    where: { id: questionId },
    data: { status: 'open', resolvedAt: null, answerEntryId: null },
  });
  revalidatePath('/digest');
}

export async function linkQuestionToFollowup(questionId: string, followupEntryId: string) {
  const user = await requireUser();
  await assertOwnsQuestion(questionId, user.id);
  const entry = await prisma.entry.findUnique({ where: { id: followupEntryId } });
  if (!entry || entry.userId !== user.id) throw new Error('Entry not found');
  await prisma.question.update({
    where: { id: questionId },
    data: { status: 'answered', answerEntryId: followupEntryId, resolvedAt: new Date() },
  });
  revalidatePath('/digest');
}
