import { requireUser } from '@/lib/session';
import EntryForm from '@/components/EntryForm';

// createEntry (invoked from EntryForm) can run several sequential AI calls
// (image vision, connections, questions) plus image processing — comfortably
// past Vercel's default 10s serverless timeout on the Hobby plan. This applies
// to Server Actions invoked from this route too. 60s is the Hobby-tier ceiling.
export const maxDuration = 60;

export default async function NewEntryPage() {
  await requireUser();
  return <EntryForm />;
}
