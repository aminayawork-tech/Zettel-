'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';

export async function createCircle(formData: FormData) {
  const user = await requireUser();
  const name = String(formData.get('name') || '').trim();
  if (!name) throw new Error('Circle name is required.');
  const circle = await prisma.circle.create({
    data: {
      name,
      ownerId: user.id,
      members: { create: { userId: user.id } },
    },
  });
  revalidatePath('/circles');
  redirect(`/circles/${circle.id}`);
}

export async function addMemberByEmail(circleId: string, email: string) {
  const user = await requireUser();
  const circle = await prisma.circle.findUnique({ where: { id: circleId } });
  if (!circle || circle.ownerId !== user.id) throw new Error('Not found');
  const member = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (!member) throw new Error('No Zettel user with that email yet.');
  await prisma.circleMember.upsert({
    where: { circleId_userId: { circleId, userId: member.id } },
    update: {},
    create: { circleId, userId: member.id },
  });
  revalidatePath(`/circles/${circleId}`);
}

export async function removeMember(circleId: string, userId: string) {
  const user = await requireUser();
  const circle = await prisma.circle.findUnique({ where: { id: circleId } });
  if (!circle || circle.ownerId !== user.id) throw new Error('Not found');
  await prisma.circleMember.deleteMany({ where: { circleId, userId } });
  revalidatePath(`/circles/${circleId}`);
}

export async function deleteCircle(circleId: string) {
  const user = await requireUser();
  await prisma.circle.deleteMany({ where: { id: circleId, ownerId: user.id } });
  revalidatePath('/circles');
  redirect('/circles');
}
