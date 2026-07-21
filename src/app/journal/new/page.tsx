import { requireUser } from '@/lib/session';
import EntryForm from '@/components/EntryForm';

export default async function NewEntryPage() {
  await requireUser();
  return <EntryForm />;
}
