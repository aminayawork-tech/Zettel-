'use client';

import { useState, useTransition } from 'react';
import { createEntry } from '@/app/actions/entries';
import { LIMITS, SOURCE_TYPES } from '@/lib/enums';
import { wordCount } from '@/lib/utils';
import ImageSlot from '@/components/ImageSlot';
import EntryImagesUploader from '@/components/EntryImagesUploader';

const QUOTE_WORD_CAP = 30;

export default function EntryForm() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [quickMode, setQuickMode] = useState(false);

  const [sourceTitle, setSourceTitle] = useState('');
  const [sourceType, setSourceType] = useState('book');
  const [sourceLink, setSourceLink] = useState('');
  const [mainIdea, setMainIdea] = useState('');
  const [takeaways, setTakeaways] = useState(['', '', '']);
  const [surprise, setSurprise] = useState('');
  const [whyItMatters, setWhyItMatters] = useState('');
  const [questions, setQuestions] = useState<string[]>(['']);
  const [action, setAction] = useState('');
  const [explanation, setExplanation] = useState('');
  const [quote, setQuote] = useState('');
  const [tags, setTags] = useState('');

  const [entryImages, setEntryImages] = useState<File[]>([]);
  const [takeawayImages, setTakeawayImages] = useState<(File | null)[]>([null, null, null]);
  const [quoteImage, setQuoteImage] = useState<File | null>(null);

  const takeawayLabel = quickMode ? 'Important Points' : 'Three Key Takeaways';

  function handleSubmit() {
    setError(null);
    if (!sourceTitle.trim() || !mainIdea.trim()) {
      setError('Source title and main idea are required.');
      return;
    }
    const fd = new FormData();
    fd.set('sourceTitle', sourceTitle);
    fd.set('sourceType', sourceType);
    fd.set('sourceLink', sourceLink);
    fd.set('mainIdea', mainIdea);
    takeaways.forEach((t, i) => fd.set(`takeaway_${i}`, t));
    fd.set('surprise', quickMode ? '' : surprise);
    fd.set('whyItMatters', quickMode ? '' : whyItMatters);
    fd.set('action', action);
    fd.set('explanation', quickMode ? '' : explanation);
    fd.set('quote', quickMode ? '' : quote);
    fd.set('quickMode', String(quickMode));
    fd.set('tags', tags);
    fd.set('questionsJson', JSON.stringify(quickMode ? [] : questions.filter((q) => q.trim())));

    entryImages.forEach((f) => fd.append('entryImages', f));
    if (!quickMode) {
      takeawayImages.forEach((f, i) => {
        if (f) fd.set(`takeawayImage_${i}`, f);
      });
      if (quoteImage) fd.set('quoteImage', quoteImage);
    }

    startTransition(async () => {
      try {
        await createEntry(fd);
      } catch (e) {
        const digest = (e as { digest?: string })?.digest;
        if (digest?.startsWith('NEXT_REDIRECT')) throw e;
        setError(e instanceof Error ? e.message : 'Something went wrong saving your entry.');
      }
    });
  }

  return (
    <div className="space-y-8 pb-16">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl font-bold">New entry</h1>
        <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
          <span className={quickMode ? 'text-ink/40' : 'font-medium'}>Full</span>
          <span className="relative inline-block w-10 h-5">
            <input
              type="checkbox"
              className="peer sr-only"
              checked={quickMode}
              onChange={(e) => setQuickMode(e.target.checked)}
            />
            <span className="absolute inset-0 rounded-full bg-ink/20 peer-checked:bg-accent transition-colors" />
            <span className="absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform peer-checked:translate-x-5" />
          </span>
          <span className={quickMode ? 'font-medium' : 'text-ink/40'}>Quick (1-3-1)</span>
        </label>
      </div>

      {quickMode && (
        <p className="text-sm text-ink/60 -mt-4">
          Fast path: 1 Big Idea, 3 Important Points, 1 Action. Connections and question suggestions still run automatically once you save.
        </p>
      )}

      {/* Source */}
      <section className="card p-5 space-y-4">
        <h2 className="font-serif text-lg font-semibold">What did you just finish?</h2>
        <div className="grid sm:grid-cols-[1fr,180px] gap-4">
          <div>
            <label className="label">Title</label>
            <input className="input" value={sourceTitle} onChange={(e) => setSourceTitle(e.target.value)} placeholder="e.g. Deep Work" />
          </div>
          <div>
            <label className="label">Type</label>
            <select className="input" value={sourceType} onChange={(e) => setSourceType(e.target.value)}>
              {SOURCE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t[0].toUpperCase() + t.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="label">Link (optional)</label>
          <input className="input" value={sourceLink} onChange={(e) => setSourceLink(e.target.value)} placeholder="https://…" />
        </div>
        <div>
          <label className="label">Photos (optional)</label>
          <EntryImagesUploader onChange={setEntryImages} />
        </div>
      </section>

      {/* Main idea */}
      <section className="card p-5 space-y-2">
        <h2 className="font-serif text-lg font-semibold">Main idea</h2>
        <p className="text-xs text-ink/50">One sentence. What&apos;s the single thing you want to remember?</p>
        <textarea
          className="input"
          rows={2}
          maxLength={LIMITS.mainIdea}
          value={mainIdea}
          onChange={(e) => setMainIdea(e.target.value)}
        />
        <div className="text-xs text-right text-ink/40">
          {mainIdea.length}/{LIMITS.mainIdea}
        </div>
      </section>

      {/* Takeaways */}
      <section className="card p-5 space-y-3">
        <h2 className="font-serif text-lg font-semibold">{takeawayLabel}</h2>
        <p className="text-xs text-ink/50">Facts, not opinions.</p>
        {takeaways.map((t, i) => (
          <div key={i} className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-ink/40 text-sm w-4">{i + 1}.</span>
              <input
                className="input"
                maxLength={LIMITS.takeaway}
                value={t}
                onChange={(e) => {
                  const next = [...takeaways];
                  next[i] = e.target.value;
                  setTakeaways(next);
                }}
              />
            </div>
            {!quickMode && (
              <div className="pl-6">
                <ImageSlot
                  label="attach photo"
                  onChange={(file) => {
                    const next = [...takeawayImages];
                    next[i] = file;
                    setTakeawayImages(next);
                  }}
                />
              </div>
            )}
          </div>
        ))}
      </section>

      {!quickMode && (
        <>
          {/* Surprise */}
          <section className="card p-5 space-y-2">
            <h2 className="font-serif text-lg font-semibold">What surprised me? <span className="text-ink/40 font-normal text-sm">(optional)</span></h2>
            <textarea className="input" rows={2} value={surprise} onChange={(e) => setSurprise(e.target.value)} />
          </section>

          {/* Why it matters */}
          <section className="card p-5 space-y-2">
            <h2 className="font-serif text-lg font-semibold">Why does this matter?</h2>
            <textarea className="input" rows={2} value={whyItMatters} onChange={(e) => setWhyItMatters(e.target.value)} />
          </section>

          {/* Connections / tags */}
          <section className="card p-5 space-y-2">
            <h2 className="font-serif text-lg font-semibold">Connections</h2>
            <p className="text-xs text-ink/50">
              Tag topics manually — Zettel will also suggest connections to past entries automatically once you save.
            </p>
            <input className="input" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="e.g. focus, habits, productivity (comma separated)" />
          </section>

          {/* Questions */}
          <section className="card p-5 space-y-3">
            <h2 className="font-serif text-lg font-semibold">Questions I still have</h2>
            <p className="text-xs text-ink/50">Zettel will suggest a few more angles once you save.</p>
            {questions.map((q, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  className="input"
                  value={q}
                  onChange={(e) => {
                    const next = [...questions];
                    next[i] = e.target.value;
                    setQuestions(next);
                  }}
                  placeholder="What am I still unsure about?"
                />
                {questions.length > 1 && (
                  <button type="button" className="text-ink/30 hover:text-ink" onClick={() => setQuestions(questions.filter((_, idx) => idx !== i))}>
                    ×
                  </button>
                )}
              </div>
            ))}
            <button type="button" className="btn-ghost text-xs" onClick={() => setQuestions([...questions, ''])}>
              + Add another question
            </button>
          </section>
        </>
      )}

      {/* Action */}
      <section className="card p-5 space-y-2">
        <h2 className="font-serif text-lg font-semibold">One action I&apos;ll take this week</h2>
        <input className="input" value={action} onChange={(e) => setAction(e.target.value)} />
      </section>

      {!quickMode && (
        <>
          {/* Feynman */}
          <section className="card p-5 space-y-2">
            <h2 className="font-serif text-lg font-semibold">How would I explain this in plain English?</h2>
            <p className="text-xs text-ink/50">The Feynman test — explain it like you would to a curious 12-year-old.</p>
            <textarea className="input" rows={3} value={explanation} onChange={(e) => setExplanation(e.target.value)} />
          </section>

          {/* Quote */}
          <section className="card p-5 space-y-2">
            <h2 className="font-serif text-lg font-semibold">One quote or line worth remembering</h2>
            <textarea
              className="input"
              rows={2}
              value={quote}
              onChange={(e) => {
                const words = e.target.value.trim().split(/\s+/);
                if (words.length <= QUOTE_WORD_CAP || e.target.value.length < quote.length) {
                  setQuote(e.target.value);
                }
              }}
            />
            <div className="flex items-center justify-between text-xs text-ink/40">
              <span>{wordCount(quote)}/{QUOTE_WORD_CAP} words</span>
              <ImageSlot label="attach photo" onChange={setQuoteImage} />
            </div>
          </section>
        </>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="sticky bottom-4 flex justify-end">
        <button type="button" disabled={pending} onClick={handleSubmit} className="btn-primary shadow-lg px-8">
          {pending ? 'Saving…' : 'Save entry'}
        </button>
      </div>
    </div>
  );
}
