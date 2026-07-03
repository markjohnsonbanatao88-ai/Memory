# people_map — next fix design note (not yet implemented)

## Problem
`extractPeopleMentions` in `lib/services/memory-distillation-service.ts` treats any capitalized
token-sequence as a person, then filters with a hand-maintained stoplist
(`PERSON_NAME_STOPWORDS`). PRs #123/#124 added dedup, alias canonicalization, caps, and a growing
stoplist — but a stoplist can never enumerate every capitalized non-name word. Live `people_map`
still surfaces junk like `Money`, `Strong`, `Clean`, `Boracay`, `Codex`, `Build`, `Googlebot`,
`Uploaded Janine Tan`, `Ong Messenger`.

**This is whack-a-mole. Do not add more stoplist words.**

## Decision
The correct next step is a **known-people whitelist (Option A)** — deterministic, no model calls,
no embeddings, no gated intelligence. NER (Option B) is deferred because it implies model behavior
(`PANDORA_ENABLE_MODEL_CALLS`, gated).

## Proposed shape (for a future PR)
1. **Static config `config/known-people.json`** (per-namespace), e.g.:
   ```json
   { "au": { "canonical": ["Janine Tan", "Mang Jun", "Joven Del Rosario"], "aliases": { "Janine": "Janine Tan", "Jana": "Jana", "Jan Jan": "Janine Tan" } },
     "real_life": { "canonical": ["Joven", "Patty"], "aliases": {} } }
   ```
2. `extractPeopleMentions` becomes whitelist-first:
   - a matched capitalized span is a **person** only if it (or an alias) is in the namespace's
     `canonical`/`aliases` set;
   - everything else goes to a new **`candidate_entities`** array (name + event_ids), *not*
     `people_map`, so unknown capitalized nouns are surfaced for review but never asserted as people;
   - keep existing dedup, alias canonicalization, and caps.
3. Optionally seed the whitelist from confirmed `memory_profiles` of type `person_profile`
   (subject_key = confirmed person) so the whitelist grows only from reviewed data.
4. Tests: whitelisted names appear in `people_map`; unknown nouns go to `candidate_entities`;
   aliases canonicalize; AU/real_life whitelists stay separate.

## Why not implement now
There is no existing static known-people config to reuse, and inventing the whitelist contents is a
data/product decision (who counts as a tracked person, especially given AU fictionalization rules and
real-person privacy boundaries). Blocked on that decision; documented here so the next session can
pick it up without re-deriving it. Future NER remains gated.
