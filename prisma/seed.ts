import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10);

  const alex = await prisma.user.upsert({
    where: { email: 'alex@example.com' },
    update: {},
    create: { name: 'Alex Rivera', email: 'alex@example.com', passwordHash },
  });

  const jordan = await prisma.user.upsert({
    where: { email: 'jordan@example.com' },
    update: {},
    create: { name: 'Jordan Lee', email: 'jordan@example.com', passwordHash },
  });

  const focusTag = await prisma.tag.upsert({ where: { name: 'focus' }, update: {}, create: { name: 'focus' } });
  const habitsTag = await prisma.tag.upsert({ where: { name: 'habits' }, update: {}, create: { name: 'habits' } });

  const entry1 = await prisma.entry.create({
    data: {
      userId: alex.id,
      sourceTitle: 'Deep Work',
      sourceType: 'book',
      mainIdea: 'The ability to focus without distraction is becoming rare and valuable.',
      surprise: 'Attention residue from switching tasks lingers far longer than I assumed.',
      whyItMatters: 'My best output always comes from long uninterrupted blocks, not busy multitasking.',
      action: 'Block two 90-minute deep work sessions this week.',
      explanation: 'Your brain needs unbroken time to do hard thinking, and every notification resets the clock.',
      quote: 'Clarity about what matters provides clarity about what does not.',
      quickMode: false,
      createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      tags: { create: [{ tagId: focusTag.id }] },
      takeaways: {
        create: [
          { text: 'Shallow work is logistically necessary but doesn’t create new value.', position: 0 },
          { text: 'Attention residue makes task-switching costly for up to 20+ minutes.', position: 1 },
          { text: 'Rituals (place, time, structure) make deep work sustainable.', position: 2 },
        ],
      },
      questions: {
        create: [
          { text: 'Does this hold up in highly collaborative, meeting-heavy roles?', userId: alex.id, origin: 'user', accepted: true },
        ],
      },
    },
  });

  const entry2 = await prisma.entry.create({
    data: {
      userId: alex.id,
      sourceTitle: 'Atomic Habits',
      sourceType: 'book',
      mainIdea: 'Small 1% improvements compound into remarkable results over time.',
      whyItMatters: 'It reframes discipline as identity and systems, not willpower.',
      action: 'Set out running shoes by the door every night.',
      quickMode: true,
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      tags: { create: [{ tagId: habitsTag.id }] },
      takeaways: {
        create: [
          { text: 'Habits are the compound interest of self-improvement.', position: 0 },
          { text: 'Identity-based habits ("I am someone who...") outlast goal-based ones.', position: 1 },
          { text: 'Environment design beats motivation for consistency.', position: 2 },
        ],
      },
    },
  });

  await prisma.link.create({
    data: {
      fromEntryId: entry2.id,
      toEntryId: entry1.id,
      relationType: 'supports',
      status: 'confirmed',
      aiSuggested: true,
      aiRationale: 'Both argue that consistent systems and environment design outperform raw willpower or motivation.',
    },
  });

  const circle = await prisma.circle.create({
    data: {
      name: 'Book Club',
      ownerId: alex.id,
      members: { create: [{ userId: alex.id }, { userId: jordan.id }] },
    },
  });

  await prisma.shareEvent.create({
    data: {
      entryId: entry1.id,
      ownerId: alex.id,
      scope: 'full_entry',
      circleId: circle.id,
      token: 'demo-share-token-deep-work',
      replies: {
        create: [{ userId: jordan.id, text: 'This matches what I noticed after turning off Slack notifications for a week.' }],
      },
    },
  });

  console.log('Seeded demo data.');
  console.log('Login as alex@example.com / password123 or jordan@example.com / password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
