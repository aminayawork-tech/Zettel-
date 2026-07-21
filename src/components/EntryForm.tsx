'use client';

import { useState, useTransition } from 'react';
import { createEntry, polishEntryDraft } from '@/app/actions/entries';
import type { PolishResult } from '@/lib/ai';
import { LIMITS, SOURCE_TYPES } from '@/lib/enums';
import { wordCount } from '@/lib/utils';
import ImageSlot from '@/components/ImageSlot';
import EntryImagesUploader from '@/components/EntryImagesUploader';

const QUOTE_WORD_CAP = 30;

export default function EntryForm() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [quickMode, setQuickMode] = useState(true);

  const [sourceTitle, setSourceTitle] = useState('');
  const [sourceType, setSourceType] = useState('book');
  const [sourceLink, setSourceLink] = useState('');
  const [headline, setHeadline] = useState('');
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

  const [polishing, setPolishing] = useState(false);
  const [polishError, setPolishError] = useState<string | null>(null);
  const [polishResult, setPolishResult] = useState<PolishResult | null>(null);
  const [polishBaseline, setPolishBaseline] = useState<{ mainIdea: string; takeaways: string[]; surprise: string; whyItMatters: string; explanation: string; quote: string } | null>(null);

  const takeawayLabel = quickMode ? 'Important Points' : 'Three Key Takeaways';

  function handlePolish() {
    setPolishError(null);
    if (!sourceTitle.trim() || !mainIdea.trim()) {
      setPolishError('Add a source title and main idea first.');
      return;
    }
    setPolishing(true);
    setPolishResult(null);
    const baseline = { mainIdea, takeaways: [...takeaways], surprise, whyItMatters, explanation, quote };
    startTransition(async () => {
      try {
        const result = await polishEntryDraft({
          sourceTitle,
          mainIdea,
          takeaways: takeaways.filter(Boolean),
          surprise: surprise || undefined,
          whyItMatters: whyItMatters || undefined,
          explanation: explanation || undefined,
          quote: quote || undefined,
        });
        setPolishing(false);
        if (!result) {
          setPolishError('AI polish is unavailable right now.');
          return;
        }
        setPolishBaseline(baseline);
        setPolishResult(result);
      } catch (e) {
        setPolishing(false);
        setPolishError(e instanceof Error ? e.message : 'Something went wrong.');
      }
    });
  }

  function applyAllCorrections() {
    if (!polishResult) return;
    setMainIdea(polishResult.corrected.mainIdea.slice(0, LIMITS.mainIdea));
    setTakeaways((prev) => prev.map((t, i) => polishResult.corrected.takeaways[i] ?? t));
    if (!quickMode) {
      setSurprise(polishResult.corrected.surprise);
      setWhyItMatters(polishResult.corrected.whyItMatters);
      setExplanation(polishResult.corrected.explanation);
      setQuote(polishResult.corrected.quote.slice(0, 400));
    }
    setPolishResult(null);
    setPolishBaseline(null);
  }

  function useSuggestedHeadline() {
    if (!polishResult) return;
    setHeadline(polishResult.headline.slice(0, LIMITS.mainIdea));
  }

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
    fd.set('headline', headline);
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
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-serif text-2xl sm:text-3xl font-bold">New entry</h1>
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

      {/* AI Polish */}
      <section className="card p-5 space-y-3 border-accent/20">
        <div>
          <h2 className="font-serif text-lg font-semibold">Headline <span className="text-ink/40 font-normal text-sm">(optional)</span></h2>
          <p className="text-xs text-ink/50 mb-2">A punchier title for this reflection — separate from {sourceTitle || 'the source'}&apos;s actual title.</p>
          <input
            className="input"
            maxLength={LIMITS.mainIdea}
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            placeholder="Zettel can suggest one below"
          />
        </div>

        <button type="button" disabled={polishing} className="btn-secondary text-sm" onClick={handlePolish}>
          {polishing ? 'Polishing…' : '✨ Polish with AI'}
        </button>
        <p className="text-xs text-ink/40 -mt-2">Grammar-checks what you&apos;ve written and suggests a headline. Your voice and meaning stay intact.</p>

        {polishError && <p className="text-sm text-red-600">{polishError}</p>}

        {polishResult && polishBaseline && (
          <div className="border border-accent/30 bg-accent/5 rounded-md p-3 space-y-3">
            {polishResult.headline && (
              <div className="flex items-center justify-between gap-2 text-sm">
                <span>
                  Suggested headline: <span className="font-medium">{polishResult.headline}</span>
                </span>
                <button type="button" className="btn-secondary text-xs py-1 shrink-0" onClick={useSuggestedHeadline}>
                  Use this
                </button>
              </div>
            )}

            <PolishDiff label="Main idea" before={polishBaseline.mainIdea} after={polishResult.corrected.mainIdea} />
            {polishBaseline.takeaways.map((t, i) => (
              <PolishDiff key={i} label={`Takeaway ${i + 1}`} before={t} after={polishResult.corrected.takeaways[i] || t} />
            ))}
            {!quickMode && (
              <>
                <PolishDiff label="Surprise" before={polishBaseline.surprise} after={polishResult.corrected.surprise} />
                <PolishDiff label="Why it matters" before={polishBaseline.whyItMatters} after={polishResult.corrected.whyItMatters} />
                <PolishDiff label="Explanation" before={polishBaseline.explanation} after={polishResult.corrected.explanation} />
                <PolishDiff label="Quote" before={polishBaseline.quote} after={polishResult.corrected.quote} />
              </>
            )}

            <div className="flex gap-2 pt-1">
              <button type="button" className="btn-primary text-xs py-1.5" onClick={applyAllCorrections}>
                Apply grammar corrections
              </button>
              <button type="button" className="btn-ghost text-xs py-1.5" onClick={() => { setPolishResult(null); setPolishBaseline(null); }}>
                Dismiss
              </button>
            </div>
          </div>
        )}
      </section>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="sticky bottom-0 -mx-4 sm:mx-0 px-4 sm:px-0 py-3 sm:py-0 bg-paper/95 backdrop-blur border-t border-ink/10 sm:border-0 sm:bg-transparent sm:backdrop-blur-none flex sm:justify-end">
        <button type="button" disabled={pending} onClick={handleSubmit} className="btn-primary shadow-lg w-full sm:w-auto sm:px-8">
          {pending ? 'Saving…' : 'Save entry'}
        </button>
      </div>
    </div>
  );
}

function PolishDiff({ label, before, after }: { label: string; before: string; after: string }) {
  if (!before.trim() || !after.trim() || before.trim() === after.trim()) return null;
  return (
    <div className="text-sm">
      <p className="text-xs text-ink/40">{label}</p>
      <p className="text-ink/40 line-through decoration-ink/30">{before}</p>
      <p>{after}</p>
    </div>
  );
}
