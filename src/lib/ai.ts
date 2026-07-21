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
