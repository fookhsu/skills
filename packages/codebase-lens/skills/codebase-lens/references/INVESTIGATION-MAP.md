# Investigation map

The investigation map is the workflow's resumable control plane. It records where the investigation is, which perspective is active, what source has and has not been read, and the next bounded reading slice. Keep it separate from the domain-concepts document and the final HTML report.

## Lifecycle

Create `investigation-map.md` in the selected artifact workspace before reading source. Update it after every stage transition and reading slice. On resume, read it before reconnaissance and continue from its recorded frontier instead of repeating completed work.

The map is revision-specific. Record the full revision and worktree state. When the revision or a previously read file changes, mark affected coverage `STALE`; do not silently carry `READ` status across changed content.

The map is a state file, not a narrative report or command log. Keep only the current position, compact coverage, frontier, decisions, and blockers.

## Position: stage, mode, and lens

Record all three dimensions because they answer different questions:

- **Stage** — the current workflow position: `BASELINE`, `QUESTION`, `LANDMARKS`, `INVESTIGATE`, `MODULE_MAP`, `VERIFY`, `REPORT`, or `DEMO`.
- **Mode** — the user intent: `ORIENT`, `TRACE`, `IMPACT`, `VERIFY`, or an explicitly approved `DEMO`. Combined modes remain visible in their execution order.
- **Lens** — the perspective currently applied inside a stage: `behavior`, `module`, `data`, `change`, or `evidence`.

Every stage row has one state: `PENDING`, `CURRENT`, `COMPLETE`, `BLOCKED`, or `SKIPPED`. Exactly one nonterminal stage is `CURRENT`. Record the reason for `BLOCKED` and `SKIPPED`.

## Coverage: read and unread source

Coverage is independent of evidence. Coverage says whether source was inspected; evidence says how a conclusion is known. An inspected region may still support an `UNKNOWN` conclusion.

Use these coverage states:

- `UNREAD` — discovered but not inspected;
- `QUEUED` — selected for a future slice;
- `READING` — in the current slice;
- `PARTIAL` — some named symbols or ranges were read, but the containing unit was not read completely;
- `READ` — the recorded unit was inspected at the recorded revision;
- `SKIPPED` — intentionally excluded, with a reason;
- `STALE` — previously inspected content changed and must be reconsidered.

Use adaptive granularity. Start with repository, workspace, package, or directory rows. Expand only a frontier unit into files, symbols, or line ranges. When all relevant children are resolved, collapse them into a parent summary. A coarse `UNREAD` row honestly represents an uninventoried subtree without listing every file.

A file is `READ` only if the entire file was inspected. Reading selected functions makes the file `PARTIAL`; record the exact linked symbols or ranges that are `READ` and leave the remainder `UNREAD`. Generated, vendored, cached, and build output may be `SKIPPED` with the applicable rule.

## Frontier and bounded slices

The frontier is an ordered queue of the smallest source units that can advance the current question. Each row records:

- linked path, symbol, or line range;
- why it is next;
- active mode and lens;
- expected relationship or uncertainty;
- estimated file and line cost.

For each slice:

1. Select no more than `slice-files` candidate files and `slice-lines` aggregate source lines for the entire slice.
2. Mark selected units `READING` before inspection.
3. Read only those units, following the large-file and source-link rules in [CODE-READING.md](CODE-READING.md).
4. Mark exact inspected units `READ`, containers `PARTIAL` when appropriate, and deliberate exclusions `SKIPPED`.
5. Add discovered dependencies or callers as `UNREAD` or `QUEUED`; do not follow them implicitly in the same slice.
6. Record conclusions, contradictions, and the next highest-value slice.
7. Stop the invocation when `max-slices` is reached, even if `stop-after` is later; persist a resumable frontier instead of advancing the stage artificially.
8. Stop at `stop-after` when that stage is genuinely complete.

A child investigator receives one non-overlapping slice. The parent alone reconciles child results and updates the authoritative map.

## Size bound

Keep `investigation-map.md` below 1,000 physical lines; target 500 or fewer. Before it reaches 800 lines:

- collapse completed child rows into a linked parent summary;
- remove superseded frontier entries;
- retain only current decisions rather than an append-only history;
- move explanatory prose to the HTML report;
- keep unresolved, `PARTIAL`, `UNREAD`, `QUEUED`, `BLOCKED`, and `STALE` rows explicit.

Never split the current control state across multiple maps. Compact resolved coverage instead.

## Required shape

```md
# Investigation map

- Repository: `/absolute/repository/path`
- Revision: `<full revision>`
- Worktree: `clean` or a concise pre-existing-change summary
- Scope: `<package, directory, behavior, symbol, or diff>`
- Question: `<one primary reading question>`
- Current stage: `INVESTIGATE`
- Modes: `TRACE → VERIFY`
- Active lens: `behavior`
- Budget: `slice-files=8; slice-lines=400; max-slices=3`
- Updated: `<timestamp>`
- Domain concepts: [domain-concepts.md](domain-concepts.md)
- Report: pending or [report.html](report.html)

## Stage map

| Stage | State | Mode | Lens | Completion or blocker |
|---|---|---|---|---|
| BASELINE | COMPLETE | TRACE | evidence | Revision and existing changes recorded |
| INVESTIGATE | CURRENT | TRACE | behavior | Following route registration to handler |
| VERIFY | PENDING | VERIFY | evidence | Reverse trace not started |

## Frontier

| Priority | Source unit | Coverage | Mode / lens | Why next | Estimate |
|---|---|---|---|---|---|
| 1 | [`registerOrders`](SOURCE_URL) | QUEUED | TRACE / behavior | Confirm runtime registration | 1 file / 90 lines |

## Coverage

| Source unit | Coverage | Revision | Read extent | Reason / next step |
|---|---|---|---|---|
| `src/http/**` | PARTIAL | `<revision>` | [`registerOrders`](SOURCE_URL) | Other routes remain unread |
| `src/legacy/**` | SKIPPED | `<revision>` | — | Generated compatibility layer; out of scope |

## Current conclusions

- `<claim>` — `SOURCE`, `RUNTIME`, `INFERRED`, `UNKNOWN`, or `CONTRADICTED`; [linked evidence](SOURCE_URL)

## Blockers and unknowns

- `<unknown>` — next check: `<frontier item>`
```

Paths and code symbols use the source-link contract in [CODE-READING.md](CODE-READING.md). The map is complete for a turn when its position matches the actual workflow, every inspected unit has exact coverage, every discovered in-scope unit is represented at some granularity, and the next slice or terminal condition is explicit.
