# Zettel

A reflective learning journal. Every entry starts from a piece of content you
just finished — a book, podcast, video, article, or conversation — and walks
you through a short structured reflection instead of a blank page. AI surfaces
how the new idea connects to everything you've captured before, and the best
insights can be pushed out to small private circles (family, book club)
instead of staying buried in a private log.

## Stack

- **Next.js 14 (App Router) + TypeScript + Tailwind CSS** — server components
  for data-heavy pages, server actions for all mutations (no separate REST/API
  layer to keep in sync).
- **Prisma + SQLite** for zero-config local persistence. SQLite has no native
  enum type, so enum-like fields (`relationType`, `status`, `visibility`, …)
  are plain `String` columns validated in `src/lib/enums.ts` instead of
  Prisma enums — swap the datasource `provider` to `"postgresql"` + a real
  `DATABASE_URL` for a synced multi-user deployment, and those can become
  proper enums again if you want.
- **NextAuth (Credentials provider) + bcrypt** for auth. Simple email/password
  — no OAuth wiring needed to get a working multi-user app.
- **Anthropic API (`@anthropic-ai/sdk`)** powers three things, all in
  `src/lib/ai.ts`:
  - **Image OCR/description** — images are sent straight to Claude's
    multimodal endpoint instead of a separate OCR service, since a single
    vision-capable LLM call gives you both extracted text and a description.
  - **Connections Engine** — on every entry save, a compact history (titles +
    main ideas + tags, not full text) is sent along with the new entry to
    propose 0-4 candidate links with a one-line rationale.
  - **Question Assist** — after save, suggests 2-3 additional open questions
    from a bank of archetypes (assumptions, counter-evidence, scope,
    downstream implications).
  - All three are best-effort: no `ANTHROPIC_API_KEY` (or a failed call)
    means an empty result, never a crash. The rest of the app never depends
    on the LLM being reachable.
- **Local filesystem storage** (`src/lib/storage.ts`) for uploaded images,
  behind a one-function abstraction — swap the body of `saveImageBuffer` for
  an S3/Cloudinary SDK call to go to production; nothing above that layer
  changes. `sharp` handles server-side resizing/orientation;
  `browser-image-compression` does client-side compression before upload.
- **d3-force** for a from-scratch SVG force-directed graph view (nodes =
  entries/principles, edges = confirmed links) — avoids a heavier
  canvas/WebGL graph library for a modest node count.

## Added complexity vs. a plain journal app

This is explicitly *not* a local-first note-taking app, and that has real
costs:

- **Image pipeline**: upload → compress client-side → resize/reorient
  server-side → store → vision call → persist OCR text + description. Four
  extra moving parts per photo.
- **An LLM call runs on every entry save** (connections + questions,
  sometimes + image analysis) — real latency and real cost per save, not just
  per user action. Prompts are built from compact summaries specifically to
  keep this bounded; if this were spiky/high-volume, you'd want a queue
  instead of doing it inline in the request that also redirects the user.
- **Sharing/circles need a real backend**, not local-first storage — once one
  user's data (a shared entry, a reply) needs to be visible to another user,
  you're running a synced multi-tenant database and auth, not a single-file
  local store.

## Getting started

```bash
npm install
cp .env.example .env   # fill in NEXTAUTH_SECRET and (optionally) ANTHROPIC_API_KEY
npm run db:push        # creates prisma/dev.db from the schema
npm run db:seed        # optional demo data — two users, two entries, a circle
npm run dev
```

Seeded demo accounts (after `db:seed`): `alex@example.com` /
`jordan@example.com`, password `password123`.

Without `ANTHROPIC_API_KEY` set, the app runs fully — you just won't see AI
connection/question suggestions or image OCR/descriptions.

## Data model

See `prisma/schema.prisma`. Summary:

- **Entry** — `source_entry` or `principle` (a promoted recurring pattern),
  holds the whole reflection flow (main idea, takeaways, surprise, why it
  matters, action, Feynman explanation, quote) plus resurfacing state
  (`lastRatedAt`, `stillHoldsUp`) and `visibility`.
- **Takeaway**, **Image**, **Tag/EntryTag** — entry sub-structure. Images can
  attach to the whole entry or to one field (`ImageField`: `entry` |
  `takeaway` | `quote` | `main_idea` | `surprise`).
- **Link** — typed, directed edge between two entries (`reminds_me_of` |
  `supports` | `contradicts` | `exemplifies`), with `status` (`suggested` |
  `confirmed` | `dismissed`) and, if AI-proposed, `aiRationale`.
- **Question** — persistent, searchable; `origin` (`user` | `ai`) and
  `accepted` (self-written questions are accepted immediately; AI
  suggestions start unaccepted and show up on the entry page for
  accept/dismiss); `status` (`open` | `answered`, optionally via
  `answerEntryId` linking to a follow-up entry).
- **Circle**, **CircleMember**, **ShareEvent**, **Reply** — private groups,
  what got shared with which group (or via open link) and at what scope
  (`full_entry` | `takeaway` | `quote` | `principle`), and the threaded
  replies attached to that share.

## Notable flows

- **Entry creation** (`/journal/new`) has a Full/Quick toggle. Quick mode is
  the 1-3-1 fast path (main idea, 3 points, 1 action only) — the Connections
  Engine and Question Assist still run automatically after save in both
  modes.
- **Connections** are generated at save time and land on the entry page as
  pending suggestions with a rationale; confirming picks a relation type,
  dismissing removes them. Two or more confirmed connections surface a
  prompt to promote the pattern to a **Principle**.
- **Weekly digest** (`/digest`) aggregates open questions, unfollowed
  actions, AI connections awaiting confirmation, and 1-2 older entries
  resurfaced for a "does this still hold up?" re-rating (entries not rated
  in the last 14 days).
- **Sharing** is opt-in per entry (private by default) and can scope to the
  full entry, one takeaway, or the quote; it goes to a specific circle or
  produces an open link at `/s/[token]`, where recipients can reply inline
  (sign-in required to reply, not to view).
