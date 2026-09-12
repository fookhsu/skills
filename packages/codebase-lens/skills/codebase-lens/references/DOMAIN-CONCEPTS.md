# Domain concepts document

Maintain the investigated codebase's domain language in a generated `domain-concepts.md` artifact. This document is separate from `investigation-map.md` and the HTML report: the map tracks reading progress, while this document records what project terms mean.

## Entry criteria

Add a term only when it helps a user, contributor, or future investigator communicate about the scoped behavior. A code identifier is a search hint, not automatically a domain concept. Read project instructions, `CONTEXT.md`, ADRs, user-facing language, schemas, and tests before choosing a canonical term.

Use one status:

- `CONFIRMED` — established by source, project documentation, schema, tests, or explicit user clarification;
- `CANDIDATE` — useful provisional term with incomplete evidence;
- `AMBIGUOUS` — one term appears to name multiple concepts or its limits are unclear;
- `CONTRADICTED` — sources disagree about the term or meaning.

Preserve collisions instead of choosing silently. Keep architecture vocabulary such as module, interface, seam, and adapter out of the domain glossary unless the project itself uses those as domain terms.

## Required fields

Each concept records:

1. **Canonical term** — the preferred project term.
2. **Aliases and code names** — identifiers, acronyms, legacy terms, or UI labels.
3. **Meaning and limits** — what it includes and what it must not be confused with.
4. **Lifecycle and relationships** — states, ownership, parents, children, or related concepts.
5. **Status** — one vocabulary status.
6. **Evidence** — linked project documentation and linked source symbols at the investigated revision.

Every named function, method, class, type, constant, route registration, or schema symbol in this document must be a clickable source link and show its repository-relative path and line range. Follow the source-link contract in [CODE-READING.md](CODE-READING.md). Do not fabricate a link for a dynamically generated symbol; mark it `UNKNOWN` and link the registration or generation site instead.

## Update rules

- Create the document during the `QUESTION` stage, before promoting vocabulary into the report.
- Update it after a reading slice only when the slice confirms, contradicts, or discovers a relevant term.
- Change a status only with new evidence; preserve both sides of a contradiction.
- On resume at a different revision, mark concepts whose linked evidence changed for re-verification.
- The HTML report includes only a compact concept summary and a link to this document; it does not duplicate the full glossary.
- The investigation map links this document but does not contain concept definitions.

## Size bound and sharding

No generated document may exceed 1,000 physical lines. Target 500 or fewer lines for `domain-concepts.md`. If the glossary approaches 800 lines:

1. keep `domain-concepts.md` as the canonical index and cross-domain glossary;
2. move bounded-context or subsystem entries into `domain-concepts/<name>.md`;
3. link every shard from the index and back to the index;
4. keep every shard below 1,000 lines;
5. never duplicate a concept definition across the index and a shard.

## Minimal shape

```md
# Domain concepts

- Repository: `/absolute/repository/path`
- Revision: `<full revision>`
- Scope: `<investigation scope>`
- Investigation map: [investigation-map.md](investigation-map.md)
- Updated: `<timestamp>`

| Canonical term | Aliases / code names | Meaning and limits | Lifecycle / relationships | Status | Evidence |
|---|---|---|---|---|---|
| Order | `Order`, “purchase” | A committed customer request; not a cart | Cart → Order; owns line items | CONFIRMED | [`commitOrder`](SOURCE_URL) — `src/orders/service.ts:42-88` |

## Ambiguities and contradictions

- `<term>` — `<competing meanings>` — `<linked evidence for each meaning>`

## Shards

- None, or a relative link to the generated `domain-concepts/<name>.md` shard
```

The document is complete for a turn when every material domain term used in the current conclusions has an entry or an explicit unresolved note, every code symbol is linked, and no definition is duplicated elsewhere in the artifact workspace.
