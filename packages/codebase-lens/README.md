# codebase-lens

An evidence-backed Pi skill for reading unfamiliar codebases with a resumable investigation map, bounded source slices, linked code symbols, a separate domain-concepts document, an HTML architecture/flow report, and an explicitly approved executable demo.

## What it does

- Records the current workflow stage, selected mode, and active reading lens.
- Maintains a separate `investigation-map.md` with `READ`, `PARTIAL`, `UNREAD`, `QUEUED`, `SKIPPED`, and `STALE` coverage.
- Reads large repositories incrementally using configurable file, line, slice, and stage bounds.
- Treats source files over 1,000 lines as containers and reads bounded symbols or ranges instead of the whole file.
- Maintains domain language separately in `domain-concepts.md`.
- Links every named function, method, class, type, constant, handler, registration, and schema symbol to its verified source location.
- Traces behavior, maps modules, analyzes impact, and independently verifies conclusions.
- Generates a self-contained HTML report linked to the map and domain document.
- Offers—but never silently starts—an isolated demo or in-place patch.

## Install

From npm:

```bash
pi install npm:codebase-lens
```

Or from GitHub, which installs every skill in this repository:

```bash
pi install git:github.com/fookhsu/skills
```

Add `-l` to write the install to project settings (`.pi/settings.json`) instead of user settings.

### Other agents

This is a standard `SKILL.md`, so it also runs on Claude Code, OpenAI Codex CLI, Cursor, Gemini CLI, GitHub Copilot, Cline, Windsurf, and OpenCode. Copy the skill directory into that agent's skills folder:

```bash
# Claude Code
cp -r packages/codebase-lens/skills/codebase-lens ~/.claude/skills/

# Codex CLI and other SKILL.md agents
cp -r packages/codebase-lens/skills/codebase-lens ~/.agents/skills/
```

From this repository, the helper does the same and can symlink instead of copy:

```bash
node scripts/install-skill.mjs codebase-lens --agent claude
```

## Invocation syntax

You do not need to learn a parameter language. Invoke the skill and describe what you want in ordinary language, in whatever language you use:

```text
/skill:codebase-lens What is this project, and where should I start reading?
/skill:codebase-lens Trace how POST /orders in packages/api reaches a committed order
/skill:codebase-lens What would break if Run.status gained a new value?
/skill:codebase-lens Verify that every production write goes through SearchStore
```

The skill infers the mode, scope, target, question, and reading budgets from that description, and replies in your language. Keep asking follow-up questions in the same conversation; the investigation map preserves the position.

### Explicit control (for agents and automation)

The same skill also accepts a machine-friendly control surface:

```text
/skill:codebase-lens key=value key=value ...
```

These values are appended as natural-language instructions; they are not parsed by a CLI program. Quotes are recommended for values containing spaces. The parameter table and the numbered examples below document the complete control surface so models and automation can see exactly what is available — users do not have to write them.

## Complete parameter reference

| Parameter | Accepted value | Default | Meaning |
|---|---|---|---|
| `mode` | `ORIENT`, `TRACE`, `IMPACT`, `VERIFY`, or a `+` combination such as `TRACE+VERIFY` | inferred | Investigation intent and execution order |
| `scope` | repository-relative path, glob, package, or process | relevant package or repository root | Search boundary |
| `target` | URL, command, page, event, job, file, symbol, feature, or diff | inferred from request | Concrete investigation subject |
| `question` | one quoted question | framed from `target` | Primary stop question |
| `revision` | commit, branch, tag, or diff range | current revision | Evidence baseline or impact range |
| `workspace` | `docs`, `temp`, `response-only`, or one explicitly approved directory | `docs` (→ `docs/codebase-lens/`) | Artifact lifetime and location |
| `resume` | path to an existing `investigation-map.md` | none | Resume point; its parent directory overrides `workspace` |
| `slice-files` | positive integer | `8` | Maximum candidate files per reading slice |
| `slice-lines` | integer from `1` to `1000` | `400` | Maximum aggregate source lines in one reading slice |
| `max-slices` | positive integer or `auto` | `3` | Maximum reading slices in the current invocation |
| `stop-after` | `BASELINE`, `QUESTION`, `LANDMARKS`, `INVESTIGATE`, `MODULE_MAP`, `VERIFY`, or `REPORT` | `REPORT` | Workflow checkpoint at which to return control |
| `include` | comma-separated paths or globs | none | Explicitly admitted source |
| `exclude` | comma-separated paths or globs | generated, vendor, cache, and build-output defaults | Explicitly skipped source |
| `open` | `true` or `false` | `true` | Whether to open the final HTML report |
| `demo` | `skip`, `isolated`, or `in-place` | `skip` | Preferred demo disposition; never approval before the demo contract |

Control precedence is: `resume` chooses the starting state and workspace; `scope` plus `include`/`exclude` set the boundary; `slice-files`/`slice-lines` bound each slice; `max-slices` is a hard invocation stop; `stop-after` stops at a genuinely completed stage; the demo approval gate is always last. When a repository cannot be completed within these bounds, the skill returns an incomplete but resumable map rather than hiding unread scope.

## Modes

| Mode | Primary lenses | Result |
|---|---|---|
| `ORIENT` | behavior, module, data, change, evidence | Architecture map and dependency-ordered reading path |
| `TRACE` | behavior, data, evidence | Causal path from entry to output and side effects |
| `IMPACT` | change, data, evidence | Evidence-backed blast radius and focused checks |
| `VERIFY` | evidence plus an independent lens | Confirmations, contradictions, and unknowns |
| `DEMO` | —; continuation after investigation | One explicitly approved executable tracer bullet |

`mode` is the investigation intent. `lens` is the perspective currently applied. `stage` is the position in the workflow. All three appear in `investigation-map.md`.

## Usage examples

> **Users can just describe what they want.** These `key=value` forms are a reference for the model and for automation: they show the full control surface and the expected behavior of each mode. For example, instead of `mode=TRACE scope=packages/api target="POST /orders"`, a user can simply say *"trace how POST /orders works in packages/api"*, and the skill infers the same parameters.

### 1. Let the skill infer the mode

```text
/skill:codebase-lens scope=. workspace=docs open=true
```

A broad repository request normally infers `ORIENT`.

### 2. Orient a repository with explicit reading budgets

```text
/skill:codebase-lens mode=ORIENT scope=. question="How does the primary entry point reach central behavior and effects?" workspace=docs slice-files=8 slice-lines=400 max-slices=auto stop-after=REPORT open=true demo=skip
```

### 3. Orient one package in a monorepo

```text
/skill:codebase-lens mode=ORIENT scope=packages/payments target="payments package" workspace=docs slice-files=6 slice-lines=350 max-slices=4 stop-after=MODULE_MAP open=false
```

This intentionally stops before verification and reporting; the map records `MODULE_MAP` and the remaining frontier.

### 4. Trace an HTTP request

```text
/skill:codebase-lens mode=TRACE scope=packages/api target="POST /orders" question="How does POST /orders reach a committed order?" workspace=docs slice-files=8 slice-lines=400 max-slices=5 stop-after=REPORT open=true
```

### 5. Trace a CLI command

```text
/skill:codebase-lens mode=TRACE scope=cmd target="orders import command" question="How are arguments parsed, validated, persisted, and reported?" workspace=docs slice-files=5 slice-lines=300 max-slices=4 stop-after=VERIFY open=false
```

### 6. Trace an event or background job

```text
/skill:codebase-lens mode=TRACE scope=packages/workers target="OrderPlaced consumer" question="What selects the consumer, what does it change, and how are retries handled?" include="packages/workers/**,packages/orders/**" exclude="**/fixtures/**" workspace=docs slice-files=7 slice-lines=400 max-slices=6 stop-after=REPORT open=true
```

### 7. Analyze a symbol's impact

```text
/skill:codebase-lens mode=IMPACT scope=packages/core target="Run.status" question="What changes if Run.status gains a value?" revision=HEAD workspace=docs slice-files=8 slice-lines=400 max-slices=auto stop-after=REPORT open=true
```

### 8. Analyze a branch or diff range

```text
/skill:codebase-lens mode=IMPACT scope=. target="status-model diff" revision=main..feature/run-status include="packages/**,migrations/**,config/**" exclude="dist/**,coverage/**" workspace=docs slice-files=10 slice-lines=500 max-slices=6 stop-after=REPORT open=true
```

### 9. Verify an existing architecture claim

```text
/skill:codebase-lens mode=VERIFY scope=packages/indexer target="The indexer writes only through SearchStore" question="Is every production write routed through SearchStore?" revision=HEAD workspace=docs slice-files=6 slice-lines=350 max-slices=4 stop-after=VERIFY open=false
```

### 10. Combine trace and independent verification

```text
/skill:codebase-lens mode=TRACE+VERIFY scope=packages/checkout target="authenticated checkout" question="How does authenticated checkout commit payment and order state, and is the path independently confirmed?" workspace=docs slice-files=8 slice-lines=400 max-slices=8 stop-after=REPORT open=true
```

### 11. Restrict a very large repository

```text
/skill:codebase-lens mode=ORIENT scope=. target="public API server" include="apps/api/**,packages/domain/**,packages/storage/**" exclude="**/generated/**,**/vendor/**,**/fixtures/**" workspace=docs slice-files=5 slice-lines=300 max-slices=3 stop-after=INVESTIGATE open=false
```

Only three slices are read. Other discovered areas remain explicit `UNREAD` rows.

### 12. Read a source file larger than 1,000 lines safely

```text
/skill:codebase-lens mode=TRACE scope=src target="src/legacy-controller.ts#submitOrder" question="What does submitOrder validate and call?" workspace=docs slice-files=2 slice-lines=250 max-slices=3 stop-after=VERIFY open=false
```

The skill indexes declarations first, reads the target function and required neighboring symbols in bounded ranges, marks those symbols `READ`, and leaves the containing file `PARTIAL`.

### 13. Stop after landmarks

```text
/skill:codebase-lens mode=ORIENT scope=. target="server entry points" workspace=.codebase-lens/server-map slice-files=8 slice-lines=400 max-slices=1 stop-after=LANDMARKS open=false
```

Naming `.codebase-lens/server-map` explicitly approves writing investigation artifacts there, but does not approve source edits.

### 14. Resume the previous investigation

```text
/skill:codebase-lens resume=.codebase-lens/server-map/investigation-map.md max-slices=3 stop-after=INVESTIGATE open=false demo=skip
```

The saved scope, revision, mode, lens, and coverage are recovered from the map. Changed evidence is marked `STALE`.

### 15. Resume and continue through the report

```text
/skill:codebase-lens resume=.codebase-lens/server-map/investigation-map.md max-slices=auto stop-after=REPORT open=true
```

### 16. Create a durable artifact workspace

```text
/skill:codebase-lens mode=TRACE scope=packages/orders target="POST /orders" workspace=.codebase-lens/orders revision=HEAD slice-files=8 slice-lines=400 max-slices=auto stop-after=REPORT open=true
```

The workspace contains:

```text
.codebase-lens/orders/
├── investigation-map.md
├── domain-concepts.md
└── report.html
```

Consider adding `.codebase-lens/` to `.gitignore` when these are local working artifacts.

### 17. Produce no files

```text
/skill:codebase-lens mode=VERIFY scope=packages/auth target="authorization claim" workspace=response-only slice-files=4 slice-lines=300 max-slices=2 stop-after=VERIFY open=false
```

The response includes compact position, coverage, domain terms, direct findings, and next frontier, but cannot be resumed from disk.

### 18. Generate artifacts without opening the browser

```text
/skill:codebase-lens mode=IMPACT scope=packages/schema target="Order.version" revision=main..HEAD workspace=docs slice-files=8 slice-lines=400 max-slices=5 stop-after=REPORT open=false
```

### 19. Request an isolated demo preference

```text
/skill:codebase-lens mode=TRACE+VERIFY scope=packages/checkout target="checkout orchestration" workspace=docs slice-files=8 slice-lines=400 max-slices=6 stop-after=REPORT open=true demo=isolated
```

`demo=isolated` records the preferred disposition. The skill still presents a demo contract and waits for explicit approval before editing source.

### 20. Request an in-place demo preference

```text
/skill:codebase-lens mode=VERIFY scope=packages/indexer target="smaller indexing interface" workspace=.codebase-lens/indexer slice-files=6 slice-lines=350 max-slices=5 stop-after=REPORT open=true demo=in-place
```

An in-place patch begins only after the proposed behavior, seam, file set, verification command, non-goals, and location are visible and explicitly approved.

## Artifact workspace

Default file-producing runs create:

```text
docs/codebase-lens/
├── investigation-map.md
├── domain-concepts.md
└── report.html
```

The default `docs` location resolves to `docs/codebase-lens/` and is pre-approved by convention; `workspace=temp` still creates a fresh OS-temporary directory, and `workspace=response-only` writes no files. Consider adding `docs/codebase-lens/` to `.gitignore` when these are local working artifacts.

### `investigation-map.md`

The map is the resumable control plane. It records:

- repository, revision, worktree, scope, and primary question;
- current workflow stage, selected mode, and active lens;
- reading budgets and stop controls;
- bounded next-slice frontier;
- adaptive source coverage using `READ`, `PARTIAL`, `UNREAD`, `QUEUED`, `READING`, `SKIPPED`, and `STALE`;
- conclusions, blockers, unknowns, and the next action.

It remains below 1,000 lines by collapsing completed children into parent summaries while keeping unresolved and unread coverage explicit.

### `domain-concepts.md`

Domain terminology is not stored in the map. The separate document records canonical terms, aliases and code names, meanings and limits, lifecycles and relationships, status, and linked evidence. If it approaches 1,000 lines, it becomes an index and shards by bounded context or subsystem.

### `report.html`

The report summarizes the answer and links to both Markdown artifacts. Visuals are selected by mode:

- fixed tracks for `ORIENT` architecture;
- an ordered rail for `TRACE` execution flow;
- `DIRECT`, `INDIRECT`, `VALIDATE`, and `NO EVIDENCE` bands for `IMPACT`;
- contradiction-first verdict rows for `VERIFY`.

Graph-shaped relationships may also be authored in Mermaid and rendered client-side from a pinned runtime; sequence diagrams label participants and messages with domain concepts and key-function lifecycles. Fixed tracks, impact bands, mass diagrams, and other editorial visuals use CSS or inline SVG when exact geometry communicates the finding better.

Open the human-facing [`HTML-REPORT-PREVIEW.html`](HTML-REPORT-PREVIEW.html) to inspect the complete light/dark palette, explicit color constraints, and examples of every supported CSS, SVG, and Mermaid diagram type. The preview sits outside the skill and is not loaded during skill execution.

Every named source symbol is a clickable link pinned to the investigated revision when the repository host supports it. A verified local-file link with visible path and line range is used otherwise.

## Optional demo safety

Reading starts source-read-only. Before a demo edits code, the skill presents a contract with the hypothesis, observable behavior, proposed module interface and seam, expected files, verification command, and non-goals. The user then explicitly chooses `isolated`, `in-place`, or `skip`.

The demo is evidence, not production completion. Its result states what the experiment establishes, what remains unknown, all changed files, commands run, and whether to integrate, iterate, keep separate, or discard it.

## Package contents

```text
HTML-REPORT-PREVIEW.html       # human-facing visual gallery
skills/codebase-lens/          # agent-facing skill root
├── SKILL.md
├── agents/
│   └── openai.yaml
└── references/
    ├── ARCHITECTURE.md
    ├── CODE-READING.md
    ├── DEMO.md
    ├── DOMAIN-CONCEPTS.md
    ├── HTML-REPORT.md
    └── INVESTIGATION-MAP.md
```

## Safety

Pi packages run with full system access. This package contains instructions for inspecting repositories, writing investigation artifacts, opening a local HTML report, and—only after explicit approval—implementing a bounded demo. Review the skill before using it in sensitive repositories.

## License

MIT
