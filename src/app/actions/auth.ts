'use server';

import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export async function signupUser(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  const name = String(formData.get('name') || '').trim();
  const email = String(formData.get('email') || '').trim().toLowerCase();
  const password = String(formData.get('password') || '');

  if (!name || !email || !password) return { ok: false, error: 'All fields are required.' };
  if (password.length < 8) return { ok: false, error: 'Password must be at least 8 characters.' };

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { ok: false, error: 'An account with that email already exists.' };

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({ data: { name, email, passwordHash } });
  return { ok: true };
}
