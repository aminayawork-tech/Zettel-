// SQLite has no native enum type, so these are enforced in application code
// instead of the Prisma schema. Keep in sync with the `///` doc comments in
// prisma/schema.prisma.

export const SOURCE_TYPES = ['book', 'podcast', 'video', 'article', 'conversation', 'other'] as const;
export type SourceType = (typeof SOURCE_TYPES)[number];

export const RELATION_TYPES = ['reminds_me_of', 'supports', 'contradicts', 'exemplifies'] as const;
export type RelationType = (typeof RELATION_TYPES)[number];

export const RELATION_LABELS: Record<RelationType, string> = {
  reminds_me_of: 'Reminds me of',
  supports: 'Supports',
  contradicts: 'Contradicts',
  exemplifies: 'Exemplifies',
};

export const LINK_STATUSES = ['suggested', 'confirmed', 'dismissed'] as const;
export type LinkStatus = (typeof LINK_STATUSES)[number];

export const QUESTION_ORIGINS = ['user', 'ai'] as const;
export type QuestionOrigin = (typeof QUESTION_ORIGINS)[number];

export const QUESTION_STATUSES = ['open', 'answered'] as const;
export type QuestionStatus = (typeof QUESTION_STATUSES)[number];

export const VISIBILITIES = ['private', 'circle', 'shared'] as const;
export type Visibility = (typeof VISIBILITIES)[number];

export const SHARE_SCOPES = ['full_entry', 'takeaway', 'quote', 'principle'] as const;
export type ShareScope = (typeof SHARE_SCOPES)[number];

export const ENTRY_TYPES = ['source_entry', 'principle'] as const;
export type EntryType = (typeof ENTRY_TYPES)[number];

export const IMAGE_FIELDS = ['entry', 'takeaway', 'quote', 'main_idea', 'surprise'] as const;
export type ImageFieldType = (typeof IMAGE_FIELDS)[number];

// Hard limits enforced in the entry flow (client + server).
export const LIMITS = {
  mainIdea: 140,
  quote: 220, // roughly a "low word cap" worth of characters
  takeaway: 240,
};
