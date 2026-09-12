---
name: codebase-lens
description: Evidence-backed codebase reading: a resumable investigation map, read/unread coverage, separate domain concepts, linked source symbols, architecture and flow maps, impact analysis, and a self-contained HTML report.
license: MIT
disable-model-invocation: true
---

# Codebase Lens

Read an unfamiliar codebase by following behavior through modules. Build a verifiable, resumable mental model rather than a confident directory tour.

The investigation arc is iterative:

```text
baseline → question → landmarks
         → [select slice → investigate through active mode/lens → update maps]*
         → module map → independent verification → HTML report → optional demo
```

The arc is the workflow position. A mode is the user's investigative intent. A lens is the perspective currently applied inside a stage. Record all three in `investigation-map.md` so a user can see and control the current position.

## Invocation and control

Choose the smallest mode that answers the request. Modes may be combined in execution order.

| Mode | Primary lenses | Question | Result |
|---|---|---|---|
| `ORIENT` | behavior, module, data, change, evidence | What is this project, and where should I start? | Architecture map and dependency-ordered reading path |
| `TRACE` | behavior, data, evidence | How does this request, command, page, event, or job work? | Causal path from entry to output and side effects |
| `IMPACT` | change, data, evidence | What could this file, symbol, diff, or feature affect? | Evidence-backed blast radius and checks |
| `VERIFY` | evidence plus an independent lens | Is this understanding correct? | Confirmations, contradictions, and unknowns |
| `DEMO` | —; continuation after investigation | Would this interpretation or design work in code? | Explicitly approved, bounded executable demo |

When no mode is named, infer `ORIENT` for a broad project request, `TRACE` for named behavior, and `IMPACT` for a change target. `DEMO` is an opt-in continuation and never replaces investigation.

Arguments are a natural-language control contract appended to the invocation — `/skill:codebase-lens` on Pi, `/codebase-lens` on Claude Code, `$codebase-lens` on Codex, or an ordinary request elsewhere — not options parsed by a program. Honor these exact keys:

| Parameter | Values and default | Control |
|---|---|---|
| `mode` | `ORIENT`, `TRACE`, `IMPACT`, `VERIFY`, a `+` combination; inferred by default | Investigation intent and mode order |
| `scope` | repository-relative path, glob, package, or process; relevant package by default | Search boundary |
| `target` | URL, command, page, event, job, file, symbol, feature, or diff; inferred from request | Concrete subject |
| `question` | one quoted question; framed from target by default | Primary stop question |
| `revision` | commit, branch, tag, or diff range; current revision by default | Evidence baseline |
| `workspace` | `docs`, `temp`, `response-only`, or one approved directory; `docs` by default (→ `docs/codebase-lens/`) | Artifact lifetime and location |
| `resume` | path to an existing `investigation-map.md`; none by default | Resume point; its workspace wins over `workspace` |
| `slice-files` | positive integer; `8` by default | Maximum candidate files in one reading slice |
| `slice-lines` | integer from `1` to `1000`; `400` by default | Maximum aggregate source lines in one reading slice |
| `max-slices` | positive integer or `auto`; `3` by default | Invocation-level reading bound |
| `stop-after` | `BASELINE`, `QUESTION`, `LANDMARKS`, `INVESTIGATE`, `MODULE_MAP`, `VERIFY`, or `REPORT`; `REPORT` by default | Requested workflow checkpoint |
| `include` | comma-separated paths or globs; none by default | Explicitly admitted source |
| `exclude` | comma-separated paths or globs; generated/vendor/build defaults still apply | Explicitly skipped source |
| `open` | `true` or `false`; `true` by default for HTML | Whether to open the final report |
| `demo` | `skip`, `isolated`, or `in-place`; `skip` until the demo contract is approved | Preferred demo disposition, not pre-approval |

`include` and `exclude` first constrain `scope`; slice budgets then bound each reading unit. `max-slices` is a hard invocation stop: when reached before `stop-after`, update the map and return progress without pretending the later stage completed. `resume` controls the starting position, and the demo approval gate always remains last.

Read [references/INVESTIGATION-MAP.md](references/INVESTIGATION-MAP.md) and [references/CODE-READING.md](references/CODE-READING.md) before reconnaissance. Read [references/DOMAIN-CONCEPTS.md](references/DOMAIN-CONCEPTS.md) before recording project terminology. Read [references/ARCHITECTURE.md](references/ARCHITECTURE.md) before drawing or evaluating modules. Read [references/HTML-REPORT.md](references/HTML-REPORT.md) before choosing an artifact workspace or rendering a report. Read [references/DEMO.md](references/DEMO.md) only after the user requests or accepts a demo proposal.

## Artifacts

A file-producing investigation uses one artifact workspace with separate responsibilities. The default location is `docs/codebase-lens/` under the current directory; the `workspace` control selects another branch.

```text
<artifact-workspace>/          # default: <current-directory>/docs/codebase-lens/
├── investigation-map.md  # stage, mode, lens, read/unread coverage, frontier
├── domain-concepts.md    # canonical domain language and linked evidence
└── report.html           # final human-facing answer
```

The investigation map is authoritative for workflow position and coverage. The domain-concepts document is authoritative for terminology. The report summarizes and links both; it does not duplicate either document.

Every named source symbol in generated artifacts must be a clickable, revision-pinned source link when the repository host supports it, with a verified local-file fallback. No generated file may exceed 1,000 physical lines. Follow the compaction and sharding rules in the references.

## Operating contract

- Begin source-read-only and preserve existing user changes.
- Record repository root, revision, worktree state, scope, selected modes, and budgets before drawing conclusions.
- Read project instructions, `CONTEXT.md`, and relevant ADRs before choosing terminology or suggesting a different seam.
- Inspect configuration and actual registration sites before broad source directories.
- Treat names and directory conventions as search hints, not evidence. A static import or call graph is not runtime behavior.
- Use adaptive coverage rather than enumerating a large repository file by file. Coarse unread rows remain explicit.
- A source file over 1,000 lines is a container: index it, then read bounded symbols or ranges. Never mark the whole file `READ` after inspecting only selected functions.
- Choose one output branch: the default `docs` artifact workspace (`docs/codebase-lens/` under the current directory), a `temp` directory, response-only with no files, or one user-approved durable workspace. Writing investigation artifacts is not approval to edit project source.
- Source edits require the demo gate in [references/DEMO.md](references/DEMO.md). An invitation or `demo` preference is not approval.
- Respond and write artifacts in the user's language unless the project has a documented language convention.

## Workflow

### 1. Establish or resume the baseline

Identify the repository root, revision, worktree state, requested scope, selected modes, control parameters, and monorepo boundary. Choose the artifact branch under [references/HTML-REPORT.md](references/HTML-REPORT.md).

For a new file-producing investigation, create `investigation-map.md` and `domain-concepts.md` before reading source. For `resume`, read the existing map first, verify repository and revision, preserve valid coverage, and mark changed evidence `STALE`.

Set the map stage to `BASELINE` and active lens to `evidence`.

**Complete when:** the exact baseline, controls, artifact paths, and pre-existing changes are recorded; the map points to the domain document; and the next stage is `QUESTION` or an explicit stop condition.

### 2. Frame one reading question and domain language

Turn the request into one primary question. For broad `ORIENT`, use: “How does the primary entry point reach the project's central behavior and effects?” For behavior modes name the entry candidate and expected output or effect.

Read existing domain language first. Update only the separate domain-concepts document. Record terms as `CONFIRMED`, `CANDIDATE`, `AMBIGUOUS`, or `CONTRADICTED`; do not promote an identifier into a domain concept without evidence. Link every named code symbol.

Set the map stage to `QUESTION` and record the mode and active lens.

**Complete when:** the map names one question and target, important vocabulary uncertainties are explicit in the domain document, and the next landmark search is queued or `stop-after=QUESTION` is recorded.

### 3. Find landmarks and plan the frontier

Use project instructions, manifests, startup configuration, registrations, public interfaces, schemas, adapters, and nearest tests to identify the smallest useful source area. Inventory large scopes at package or directory granularity rather than listing every file.

Set the map stage to `LANDMARKS`. Add discovered in-scope units as `UNREAD`, promote only the next highest-value units to `QUEUED`, and plan one slice within `slice-files` and `slice-lines`. Measure candidate files; index files over 1,000 lines by declarations or symbols before selecting ranges.

**Complete when:** each landmark is linked or explicitly unresolved, the frontier identifies why every queued unit is next, untouched scope remains visible as coarse `UNREAD` coverage, and the first slice is bounded or `stop-after=LANDMARKS` is recorded.

### 4. Investigate in bounded slices

Set the map stage to `INVESTIGATE`; record the selected mode and current lens. Follow the mode-specific rules in [references/CODE-READING.md](references/CODE-READING.md):

- `ORIENT`: find the primary entry, then trace one representative behavior before generalizing.
- `TRACE`: follow only the named behavior in causal order, including relevant validation, state, effects, errors, retries, and output.
- `IMPACT`: walk from the target toward callers and effects; add startup tracing only when it establishes a claimed impact.
- `VERIFY`: state claims under test, then seek independent confirming or contradicting evidence.

For every slice, mark selected units `READING`, inspect only the bounded units, update exact symbol/range coverage to `READ`, leave containers `PARTIAL` when content remains, update domain concepts, and queue newly discovered edges for a later slice. Attach an evidence status to every material conclusion.

Repeat only while the question needs evidence and the `max-slices` and `stop-after` controls allow it. When the hard slice limit is reached before the requested stage, stop this invocation, persist the map and domain document, and return progress without advancing to later stages. Never hide an incomplete investigation: leave a resumable frontier.

**Complete when:** the selected mode's required relationships have linked paths, symbols, roles, and evidence statuses or are explicitly unresolved, or the hard invocation bound has been reached; exact read/unread coverage is current; and the map identifies the next slice or the reason investigation stopped.

### 5. Map only relevant modules

Use the scale rule in [references/ARCHITECTURE.md](references/ARCHITECTURE.md). `ORIENT` gets a compact system map; `TRACE` maps modules on the path; `IMPACT` and `VERIFY` include only modules needed to explain findings. For each included module record responsibility, interface, hidden implementation, seam, adapters, dependencies, linked paths and symbols, and evidence.

Describe current architecture before evaluating it. Respect ADRs and surface conflicts rather than silently re-litigating them.

Set the map stage to `MODULE_MAP` and active lens to `module`.

**Complete when:** every included module and relationship is supported, inferred, or unknown; no module exists only to fill a diagram; linked source locations are verified; and the map advances or records `stop-after=MODULE_MAP`.

### 6. Verify from another direction

Check key conclusions with evidence independent of the initial path: walk backward from output to entry, inspect a relationship from its caller, compare registration with configuration, compare implementation with test assertions, or run a focused existing check when safe. Record command, exit status, and relevant output for runtime evidence.

Set the map stage to `VERIFY` and active lens to `evidence`. A blocked, skipped, flaky, timed-out, or credential-dependent check remains a limitation. Re-check worktree and mark changed covered files `STALE` when commands generate or modify content.

**Complete when:** each key conclusion is confirmed, contradicted, or explicitly unresolved; coverage and the frontier reflect verification work; and the map advances or records `stop-after=VERIFY`.

### 7. Render the HTML report

Follow [references/HTML-REPORT.md](references/HTML-REPORT.md). Use the selected mode's stable visual, a relationship evidence table, verified source links, a compact reading-coverage summary linked to `investigation-map.md`, and a compact vocabulary summary linked to `domain-concepts.md`.

Set the map stage to `REPORT`, render and validate `report.html`, then update the map with the report link and terminal or resumable state. Return a concise direct answer, important unknowns, coverage status, and absolute paths for every produced artifact. For response-only, confirm no files were created and include compact position and coverage in chat.

**Complete when:** each generated file is below 1,000 lines, every named source symbol is linked, the report passes HTML checks and opens or reports the open failure, and the map accurately records completion or the next frontier.

### 8. Offer the optional demo

Offer a demo only when one bounded executable experiment would resolve an important unknown, validate a proposed interface, or make the traced behavior concrete. Present the contract required by [references/DEMO.md](references/DEMO.md), then ask for `isolated`, `in-place`, or `skip`. Stop before edits until explicit approval.

Set the map stage to `DEMO` only after approval. Demo source and generated artifacts follow the same source-link and 1,000-line document rules.

**Complete when:** no qualifying demo exists, the user declines, or an approved demo has a recorded contract, implementation evidence, changed-file list, map update, and disposition.

## Parallel investigation

For a broad repository, use parallel read-only subagents only when scopes are independent. Give each child one non-overlapping frontier slice with repository scope, question, read-only authority, active mode/lens, file and line budgets, source-link requirements, evidence format, and stop condition. Children return evidence and coverage deltas; they do not edit the authoritative map, render final artifacts, or spawn agents. The parent reconciles all deltas and owns the maps and report. For small scopes, investigate directly.

## Final check

- The map shows current stage, selected mode, active lens, controls, revision, and resumable frontier.
- Every in-scope area is represented at an honest granularity as read, partial, unread, queued, skipped, or stale.
- No file over 1,000 lines was treated as one reading unit; exact inspected symbols or ranges are recorded.
- Every material claim has evidence or an uncertainty label, and static analysis is not called runtime verification.
- Every named code symbol in generated artifacts has a verified link and visible path/line range.
- Domain concepts live in the separate domain document; the map and report only link or summarize them.
- Architecture and domain terms are not conflated.
- No generated file exceeds 1,000 physical lines; compact or shard before completion.
- Project source remains unchanged unless the user explicitly approved a demo.
- Demo output, if any, is bounded, executable, and easy to keep or discard.
