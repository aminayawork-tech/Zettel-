import Anthropic from '@anthropic-ai/sdk';
import { RELATION_TYPES, type RelationType } from '@/lib/enums';

// Central AI layer. Every call here is best-effort: if there's no API key, or
// the call fails, callers get back an empty result instead of throwing, so
// the rest of the app (saving an entry, viewing it) never depends on the
// LLM being reachable. This is what runs on every entry save — keep prompts
// small and compact (titles + main ideas, not full text) to control cost/latency.

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5';

let client: Anthropic | null = null;
function getClient(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  if (!client) client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return client;
}

export function aiEnabled(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

// ---------------------------------------------------------------------------
// Image analysis (OCR + description) — replaces a separate OCR/vision API by
// sending the image straight to Claude's multimodal endpoint.
// ---------------------------------------------------------------------------

export interface ImageAnalysis {
  ocrText: string;
  aiDescription: string;
}

export async function analyzeImage(base64: string, mediaType: string): Promise<ImageAnalysis | null> {
  const anthropic = getClient();
  if (!anthropic) return null;
  try {
    const resp = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 500,
      tools: [
        {
          name: 'record_image_analysis',
          description: 'Record extracted text and a short description of the image.',
          input_schema: {
            type: 'object',
            properties: {
              ocr_text: { type: 'string', description: 'All legible text visible in the image, verbatim. Empty string if none.' },
              description: { type: 'string', description: 'One short sentence describing what the image shows.' },
            },
            required: ['ocr_text', 'description'],
          },
        },
      ],
      tool_choice: { type: 'tool', name: 'record_image_analysis' },
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType as 'image/jpeg', data: base64 },
            },
            {
              type: 'text',
              text: 'Extract any visible text and briefly describe this image (a book page, whiteboard, screenshot, or handwritten note captured for a learning journal entry).',
            },
          ],
        },
      ],
    });
    const toolUse = resp.content.find((b) => b.type === 'tool_use');
    if (!toolUse || toolUse.type !== 'tool_use') return null;
    const input = toolUse.input as { ocr_text?: string; description?: string };
    return { ocrText: input.ocr_text || '', aiDescription: input.description || '' };
  } catch (err) {
    console.error('analyzeImage failed', err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Connections engine
// ---------------------------------------------------------------------------

export interface PastEntrySummary {
  id: string;
  title: string;
  mainIdea: string;
  tags: string[];
  type: 'source_entry' | 'principle';
}

export interface NewEntryContext {
  title: string;
  mainIdea: string;
  takeaways: string[];
  surprise?: string;
  whyItMatters?: string;
  imageText?: string;
}

export interface ConnectionSuggestion {
  toEntryId: string;
  relationType: RelationType;
  rationale: string;
}

export async function suggestConnections(
  entry: NewEntryContext,
  pastEntries: PastEntrySummary[]
): Promise<ConnectionSuggestion[]> {
  const anthropic = getClient();
  if (!anthropic || pastEntries.length === 0) return [];
  try {
    const past = pastEntries
      .map((e) => `- id: ${e.id} | [${e.type}] "${e.title}" — ${e.mainIdea}${e.tags.length ? ` (tags: ${e.tags.join(', ')})` : ''}`)
      .join('\n');
    const resp = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 800,
      tools: [
        {
          name: 'record_connections',
          description: 'Record 0-4 candidate connections between the new entry and past entries.',
          input_schema: {
            type: 'object',
            properties: {
              connections: {
                type: 'array',
                maxItems: 4,
                items: {
                  type: 'object',
                  properties: {
                    to_entry_id: { type: 'string', description: 'The id of the past entry, copied exactly from the list.' },
                    relation_type: { type: 'string', enum: RELATION_TYPES as unknown as string[] },
                    rationale: { type: 'string', description: 'One short sentence explaining why they relate, naming the specific shared idea.' },
                  },
                  required: ['to_entry_id', 'relation_type', 'rationale'],
                },
              },
            },
            required: ['connections'],
          },
        },
      ],
      tool_choice: { type: 'tool', name: 'record_connections' },
      messages: [
        {
          role: 'user',
          content: `You help a learning journal user notice connections between what they just captured and what they've captured before.

NEW ENTRY
Title: ${entry.title}
Main idea: ${entry.mainIdea}
Key takeaways: ${entry.takeaways.join(' | ')}
${entry.surprise ? `What surprised them: ${entry.surprise}\n` : ''}${entry.whyItMatters ? `Why it matters to them: ${entry.whyItMatters}\n` : ''}${entry.imageText ? `Text captured from an attached image: ${entry.imageText}\n` : ''}

PAST ENTRIES (id | type | title — main idea)
${past}

Propose 0-4 of the strongest candidate connections from the new entry to specific past entries by id. Only suggest a connection when there's a real, specific conceptual link — not just topical overlap. For each, pick the relation type that best fits (reminds_me_of = similar idea/pattern; supports = new entry backs up the old one; contradicts = they conflict; exemplifies = new entry is a concrete example of the old one's abstract point, or vice versa) and give a one-sentence rationale naming the specific shared idea, e.g. "Both describe adoption driven by affordability, not novelty."`,
        },
      ],
    });
    const toolUse = resp.content.find((b) => b.type === 'tool_use');
    if (!toolUse || toolUse.type !== 'tool_use') return [];
    const input = toolUse.input as { connections?: Array<{ to_entry_id: string; relation_type: string; rationale: string }> };
    const validIds = new Set(pastEntries.map((e) => e.id));
    return (input.connections || [])
      .filter((c) => validIds.has(c.to_entry_id) && (RELATION_TYPES as readonly string[]).includes(c.relation_type))
      .map((c) => ({ toEntryId: c.to_entry_id, relationType: c.relation_type as RelationType, rationale: c.rationale }));
  } catch (err) {
    console.error('suggestConnections failed', err);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Question assist
// ---------------------------------------------------------------------------

const QUESTION_ARCHETYPES = [
  'assumptions the source is making that went unquestioned',
  'counter-evidence or the strongest opposing view',
  'scope/generalizability — is this universally true, or only in certain situations?',
  'downstream implications — if this is correct, what else should also be true?',
];

export async function suggestQuestions(
  entry: NewEntryContext,
  userQuestions: string[]
): Promise<string[]> {
  const anthropic = getClient();
  if (!anthropic) return [];
  try {
    const resp = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 500,
      tools: [
        {
          name: 'record_questions',
          description: 'Record 2-3 additional open questions the entry has not addressed.',
          input_schema: {
            type: 'object',
            properties: {
              questions: {
                type: 'array',
                minItems: 2,
                maxItems: 3,
                items: { type: 'string' },
              },
            },
            required: ['questions'],
          },
        },
      ],
      tool_choice: { type: 'tool', name: 'record_questions' },
      messages: [
        {
          role: 'user',
          content: `A learning journal user just wrote this entry:

Title: ${entry.title}
Main idea: ${entry.mainIdea}
Key takeaways: ${entry.takeaways.join(' | ')}
${entry.whyItMatters ? `Why it matters: ${entry.whyItMatters}\n` : ''}
They already wrote these open questions themselves:
${userQuestions.length ? userQuestions.map((q) => `- ${q}`).join('\n') : '(none yet)'}

Suggest 2-3 additional sharp open questions this entry hasn't addressed, drawing on angles like: ${QUESTION_ARCHETYPES.join('; ')}. Don't repeat their own questions. Each should be a single specific question, not generic ("what assumption is being made?" is too generic — name the actual assumption).`,
        },
      ],
    });
    const toolUse = resp.content.find((b) => b.type === 'tool_use');
    if (!toolUse || toolUse.type !== 'tool_use') return [];
    const input = toolUse.input as { questions?: string[] };
    return (input.questions || []).slice(0, 3);
  } catch (err) {
    console.error('suggestQuestions failed', err);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Polish: grammar/clarity pass on the user's own writing, plus a suggested
// headline for the entry. Never touches sourceTitle (the actual book/podcast/
// etc. title) — only the user's own reflection text and an optional headline.
// ---------------------------------------------------------------------------

export interface PolishInput {
  sourceTitle: string;
  mainIdea: string;
  takeaways: string[];
  surprise?: string;
  whyItMatters?: string;
  explanation?: string;
  quote?: string;
}

export interface PolishResult {
  headline: string;
  corrected: {
    mainIdea: string;
    takeaways: string[];
    surprise: string;
    whyItMatters: string;
    explanation: string;
    quote: string;
  };
}

export async function polishEntry(entry: PolishInput): Promise<PolishResult | null> {
  const anthropic = getClient();
  if (!anthropic) return null;
  try {
    const resp = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 800,
      tools: [
        {
          name: 'record_polish',
          description: 'Record grammar-corrected text and a suggested headline for the entry.',
          input_schema: {
            type: 'object',
            properties: {
              headline: {
                type: 'string',
                description: 'A short, engaging headline for this reflection (not the source title itself) — capture the hook or the surprising part, max ~10 words.',
              },
              corrected_main_idea: { type: 'string' },
              corrected_takeaways: { type: 'array', items: { type: 'string' } },
              corrected_surprise: { type: 'string' },
              corrected_why_it_matters: { type: 'string' },
              corrected_explanation: { type: 'string' },
              corrected_quote: { type: 'string' },
            },
            required: ['headline', 'corrected_main_idea', 'corrected_takeaways'],
          },
        },
      ],
      tool_choice: { type: 'tool', name: 'record_polish' },
      messages: [
        {
          role: 'user',
          content: `Proofread this learning journal entry and suggest a headline for it.

Source: ${entry.sourceTitle}
Main idea: ${entry.mainIdea}
Takeaways:
${entry.takeaways.map((t, i) => `${i + 1}. ${t}`).join('\n')}
${entry.surprise ? `What surprised them: ${entry.surprise}\n` : ''}${entry.whyItMatters ? `Why it matters: ${entry.whyItMatters}\n` : ''}${entry.explanation ? `Plain-English explanation: ${entry.explanation}\n` : ''}${entry.quote ? `Quote: ${entry.quote}\n` : ''}

Fix only grammar, spelling, and awkward phrasing — preserve the person's own voice, meaning, and length; don't rewrite their ideas or make them more formal. Return every field you were given back (corrected or unchanged if it was already fine); leave any field the user left blank as an empty string. Also suggest one short, engaging headline for the entry itself (their reflection, not the source's actual title) — something that captures the hook or the surprising takeaway, not a generic restatement.`,
        },
      ],
    });
    const toolUse = resp.content.find((b) => b.type === 'tool_use');
    if (!toolUse || toolUse.type !== 'tool_use') return null;
    const input = toolUse.input as {
      headline?: string;
      corrected_main_idea?: string;
      corrected_takeaways?: string[];
      corrected_surprise?: string;
      corrected_why_it_matters?: string;
      corrected_explanation?: string;
      corrected_quote?: string;
    };
    return {
      headline: input.headline || '',
      corrected: {
        mainIdea: input.corrected_main_idea || entry.mainIdea,
        takeaways: input.corrected_takeaways?.length ? input.corrected_takeaways : entry.takeaways,
        surprise: input.corrected_surprise ?? entry.surprise ?? '',
        whyItMatters: input.corrected_why_it_matters ?? entry.whyItMatters ?? '',
        explanation: input.corrected_explanation ?? entry.explanation ?? '',
        quote: input.corrected_quote ?? entry.quote ?? '',
      },
    };
  } catch (err) {
    console.error('polishEntry failed', err);
    return null;
  }
}
