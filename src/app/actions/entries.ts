'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { requireUser } from '@/lib/session';
import { processUploadedImage } from '@/lib/image-pipeline';
import {
  suggestConnections,
  suggestQuestions,
  polishEntry,
  type NewEntryContext,
  type PastEntrySummary,
  type PolishInput,
  type PolishResult,
} from '@/lib/ai';
import { LIMITS, type RelationType } from '@/lib/enums';
import { capWords } from '@/lib/utils';

function fileOrNull(fd: FormData, key: string): File | null {
  const f = fd.get(key);
  return f instanceof File && f.size > 0 ? f : null;
}

async function attachImage(entryId: string, file: File, field: string, takeawayId?: string) {
  const processed = await processUploadedImage(file);
  const image = await prisma.image.create({
    data: {
      entryId,
      field,
      url: processed.url,
      width: processed.width,
      height: processed.height,
      ocrText: processed.ocrText,
      aiDescription: processed.aiDescription,
    },
  });
  if (takeawayId) {
    await prisma.takeaway.update({ where: { id: takeawayId }, data: { imageId: image.id } });
  }
  return image;
}

export async function polishEntryDraft(input: PolishInput): Promise<PolishResult | null> {
  await requireUser();
  if (!input.sourceTitle.trim() || !input.mainIdea.trim()) {
    throw new Error('Add a source title and main idea before polishing.');
  }
  return polishEntry(input);
}

export async function createEntry(formData: FormData) {
  const user = await requireUser();

  const sourceTitle = String(formData.get('sourceTitle') || '').trim();
  const sourceType = String(formData.get('sourceType') || 'other');
  const sourceLink = String(formData.get('sourceLink') || '').trim() || null;
  const headline = String(formData.get('headline') || '').trim().slice(0, LIMITS.mainIdea) || null;
  const mainIdea = capWords(String(formData.get('mainIdea') || '').trim().slice(0, LIMITS.mainIdea), 40);
  const surprise = String(formData.get('surprise') || '').trim() || null;
  const whyItMatters = String(formData.get('whyItMatters') || '').trim() || null;
  const action = String(formData.get('action') || '').trim() || null;
  const explanation = String(formData.get('explanation') || '').trim() || null;
  const quote = String(formData.get('quote') || '').trim().slice(0, LIMITS.quote) || null;
  const quickMode = formData.get('quickMode') === 'true';
  const tagsRaw = String(formData.get('tags') || '');

  if (!sourceTitle || !mainIdea) {
    throw new Error('Source title and main idea are required.');
  }

  const takeawayTexts = [0, 1, 2]
    .map((i) => String(formData.get(`takeaway_${i}`) || '').trim())
    .filter((t) => t.length > 0);

  let userQuestions: string[] = [];
  try {
    userQuestions = JSON.parse(String(formData.get('questionsJson') || '[]'));
  } catch {
    userQuestions = [];
  }
  userQuestions = userQuestions.map((q) => String(q).trim()).filter(Boolean);

  const tags = tagsRaw
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 8);

  const entry = await prisma.entry.create({
    data: {
      userId: user.id,
      type: 'source_entry',
      sourceTitle,
      sourceType,
      sourceLink,
      headline,
      mainIdea,
      surprise,
      whyItMatters,
      action,
      explanation,
      quote,
      quickMode,
      takeaways: {
        create: takeawayTexts.map((text, position) => ({ text: text.slice(0, LIMITS.takeaway), position })),
      },
    },
    include: { takeaways: true },
  });

  // Tags
  for (const name of tags) {
    const tag = await prisma.tag.upsert({ where: { name }, update: {}, create: { name } });
    await prisma.entryTag.create({ data: { entryId: entry.id, tagId: tag.id } }).catch(() => {});
  }

  // Self-written questions are accepted the moment they're written.
  for (const text of userQuestions) {
    await prisma.question.create({
      data: { text, userId: user.id, sourceEntryId: entry.id, origin: 'user', accepted: true, status: 'open' },
    });
  }

  // Images: whole-entry images
  const entryImages = formData.getAll('entryImages').filter((f): f is File => f instanceof File && f.size > 0);
  let imageText = '';
  for (const file of entryImages) {
    const img = await attachImage(entry.id, file, 'entry');
    if (img.ocrText) imageText += `${img.ocrText}\n`;
  }
  // Field-specific images
  const mainIdeaImage = fileOrNull(formData, 'mainIdeaImage');
  if (mainIdeaImage) {
    const img = await attachImage(entry.id, mainIdeaImage, 'main_idea');
    if (img.ocrText) imageText += `${img.ocrText}\n`;
  }
  const surpriseImage = fileOrNull(formData, 'surpriseImage');
  if (surpriseImage) {
    const img = await attachImage(entry.id, surpriseImage, 'surprise');
    if (img.ocrText) imageText += `${img.ocrText}\n`;
  }
  const quoteImage = fileOrNull(formData, 'quoteImage');
  if (quoteImage) {
    const img = await attachImage(entry.id, quoteImage, 'quote');
    if (img.ocrText) imageText += `${img.ocrText}\n`;
  }
  for (let i = 0; i < entry.takeaways.length; i++) {
    const file = fileOrNull(formData, `takeawayImage_${i}`);
    if (file) {
      const img = await attachImage(entry.id, file, 'takeaway', entry.takeaways[i].id);
      if (img.ocrText) imageText += `${img.ocrText}\n`;
    }
  }

  // --- Connections Engine: run on save, against a compact history ---
  const pastEntries = await prisma.entry.findMany({
    where: { userId: user.id, id: { not: entry.id } },
    select: {
      id: true,
      sourceTitle: true,
      mainIdea: true,
      type: true,
      tags: { select: { tag: { select: { name: true } } } },
    },
    orderBy: { createdAt: 'desc' },
    take: 60, // keep the compact context bounded for cost/latency
  });

  const pastSummaries: PastEntrySummary[] = pastEntries.map((e) => ({
    id: e.id,
    title: e.sourceTitle,
    mainIdea: e.mainIdea,
    tags: e.tags.map((t) => t.tag.name),
    type: e.type as 'source_entry' | 'principle',
  }));

  const newEntryContext: NewEntryContext = {
    title: sourceTitle,
    mainIdea,
    takeaways: takeawayTexts,
    surprise: surprise || undefined,
    whyItMatters: whyItMatters || undefined,
    imageText: imageText.trim() || undefined,
  };

  const suggestions = await suggestConnections(newEntryContext, pastSummaries);
  for (const s of suggestions) {
    await prisma.link
      .create({
        data: {
          fromEntryId: entry.id,
          toEntryId: s.toEntryId,
          relationType: s.relationType,
          status: 'suggested',
          aiSuggested: true,
          aiRationale: s.rationale,
        },
      })
      .catch(() => {});
  }

  // --- Question Assist: AI suggests additional angles beyond what the user asked ---
  const aiQuestions = await suggestQuestions(newEntryContext, userQuestions);
  for (const text of aiQuestions) {
    await prisma.question
      .create({
        data: { text, userId: user.id, sourceEntryId: entry.id, origin: 'ai', accepted: false, status: 'open' },
      })
      .catch(() => {});
  }

  revalidatePath('/journal');
  redirect(`/entry/${entry.id}`);
}

export async function rateEntry(entryId: string, stillHoldsUp: boolean) {
  const user = await requireUser();
  await prisma.entry.updateMany({
    where: { id: entryId, userId: user.id },
    data: { stillHoldsUp, lastRatedAt: new Date() },
  });
  revalidatePath(`/entry/${entryId}`);
  revalidatePath('/digest');
}

export async function toggleActionDone(entryId: string, done: boolean) {
  const user = await requireUser();
  await prisma.entry.updateMany({ where: { id: entryId, userId: user.id }, data: { actionDone: done } });
  revalidatePath(`/entry/${entryId}`);
  revalidatePath('/digest');
}

export async function deleteEntry(entryId: string) {
  const user = await requireUser();
  await prisma.entry.deleteMany({ where: { id: entryId, userId: user.id } });
  revalidatePath('/journal');
  redirect('/journal');
}

export async function promoteToPrinciple(input: {
  title: string;
  statement: string;
  fromEntryIds: string[];
}) {
  const user = await requireUser();
  if (!input.title.trim() || !input.statement.trim()) throw new Error('Title and statement are required.');

  const principle = await prisma.entry.create({
    data: {
      userId: user.id,
      type: 'principle',
      sourceTitle: input.title.trim(),
      sourceType: 'other',
      mainIdea: input.statement.trim().slice(0, LIMITS.mainIdea),
    },
  });

  for (const fromId of input.fromEntryIds) {
    await prisma.link
      .create({
        data: {
          fromEntryId: fromId,
          toEntryId: principle.id,
          relationType: 'exemplifies' as RelationType,
          status: 'confirmed',
          aiSuggested: false,
        },
      })
      .catch(() => {});
  }

  revalidatePath('/journal');
  revalidatePath('/graph');
  redirect(`/entry/${principle.id}`);
}
