---
name: codebase-lens
description: Evidence-backed codebase reading framework with architecture mapping, flow tracing, impact analysis, and an opt-in executable demo.
disable-model-invocation: true
---

# Codebase Lens

Read an unfamiliar codebase by following behavior through modules. Build a verifiable mental model rather than a confident directory tour.

The investigation arc is:

```text
scope → landmarks → concrete flow → module map → independent verification → HTML report → optional demo
```

## Invocation

Choose the smallest mode that answers the request. Modes may be combined.

| Mode | Question | Result |
|---|---|---|
| `ORIENT` | What is this project, and where should I start? | Architecture map and dependency-ordered reading path |
| `TRACE` | How does this request, command, page, event, or job work? | Causal path from entry to output and side effects |
| `IMPACT` | What could this file, symbol, diff, or feature affect? | Evidence-backed blast radius and checks |
| `VERIFY` | Is this understanding correct? | Independent confirmations, contradictions, and unknowns |
| `DEMO` | Would this interpretation or design work in code? | Explicitly approved, bounded executable demo |

When no mode is named, infer `ORIENT` for a broad project request, `TRACE` for named behavior, and `IMPACT` for a change target. `DEMO` is an opt-in continuation: it does not replace investigation.

Before reconnaissance, read [references/CODE-READING.md](references/CODE-READING.md). Before drawing or evaluating the module map, read [references/ARCHITECTURE.md](references/ARCHITECTURE.md). Before rendering the result, read [references/HTML-REPORT.md](references/HTML-REPORT.md). Read [references/DEMO.md](references/DEMO.md) only after the user requests or accepts a demo.

## Operating contract

- Begin read-only. Preserve existing user changes.
- Record the repository root, revision, and worktree state before drawing conclusions.
- Read project instructions, `CONTEXT.md`, and relevant ADRs before choosing terminology or suggesting a different seam.
- Inspect configuration and actual registration sites before broad source directories.
- Treat names and directory conventions as search hints, not evidence.
- A static import or call graph is not runtime behavior.
- Keep scope proportional. Establish the relevant package or executable before exploring a large monorepo.
- Choose one output: default temporary HTML, response-only with no file, or one user-approved durable HTML path. It does not otherwise edit project files or source code.
- Source edits require the demo gate in [references/DEMO.md](references/DEMO.md). An invitation to build a demo is not approval.
- Respond and write artifacts in the user's language unless the project has a documented language convention.

## Workflow

### 1. Establish the baseline

Identify the repository root, current revision, uncommitted changes, project instructions, requested scope, and selected modes. Detect whether the repository is a monorepo and narrow to the relevant package when possible.

**Complete when:** the exact scope, revision, mode, and pre-existing changes are recorded.

### 2. Frame one reading question

Turn the request into one primary question. Examples:

- “Which modules participate between `POST /orders` and the committed order?”
- “What must a caller know to use the indexing module correctly?”
- “What changes if `Run.status` gains a value?”

For broad `ORIENT`, use: “How does the primary entry point reach the project's central behavior and effects?”

Read existing domain language first. Record new terms as `CONFIRMED`, `CANDIDATE`, `AMBIGUOUS`, or `CONTRADICTED`; do not promote an identifier into a domain concept without evidence.

**Complete when:** the report names the question and target; for behavior modes it also names the entry candidate and expected output or effect; important vocabulary uncertainties are explicit.

### 3. Run the selected investigation

Use manifests, startup configuration, registration, schemas, adapters, tests, and targeted source searches to choose the smallest useful file set. Follow the mode-specific completion rules in [references/CODE-READING.md](references/CODE-READING.md):

- `ORIENT`: reconnoiter broadly enough to find the primary entry, then trace one representative behavior before generalizing.
- `TRACE`: follow only the named behavior in causal order, including relevant validation, state, effects, errors, retries, and output.
- `IMPACT`: walk from the target toward callers and effects; do not add a general startup trace unless it establishes a claimed impact.
- `VERIFY`: state the claims under test, then seek independent confirming or contradicting evidence; do not orient the whole repository unless scope is itself disputed.

Attach an evidence status to every material conclusion using [references/CODE-READING.md](references/CODE-READING.md).

**Complete when:** the selected mode's required relationships have paths, symbols, roles, and evidence statuses, or are explicitly unresolved.

### 4. Map only the relevant modules

Use the scale rule in [references/ARCHITECTURE.md](references/ARCHITECTURE.md). `ORIENT` gets a compact system map; `TRACE` maps the modules on the path; `IMPACT` and `VERIFY` name only modules needed to explain the findings. For each included module record its responsibility, interface, hidden implementation, seam, adapters, dependencies, key paths and symbols, and evidence.

Describe the current architecture before evaluating it. Mark a module shallow only when caller knowledge or orchestration visibly leaks across its seam. Respect ADRs; surface a conflict instead of silently re-litigating it.

**Complete when:** every included module and relationship is supported, marked inferred, or left unknown, and no module was added only to fill out a diagram.

### 5. Verify from another direction

Check key conclusions with evidence independent of the initial path: walk backward from output to entry, inspect a relationship from its caller, compare registration with configuration, compare implementation with test assertions, or run a focused existing check when safe. Record the command, exit status, and relevant output for runtime evidence.

A blocked, skipped, flaky, timed-out, or credential-dependent check remains a limitation. Re-check the worktree after commands that may generate files.

**Complete when:** each key conclusion is confirmed, contradicted, or explicitly unresolved.

### 6. Render the HTML report

Follow the output decision table in [references/HTML-REPORT.md](references/HTML-REPORT.md): default to one securely created temporary HTML file; write no file for response-only; or write only to an approved durable path. Open a produced file unless the user declines. Use HTML/CSS layout rather than Markdown or Mermaid diagrams:

- `ORIENT`: fixed-track architecture map plus dependency-ordered reading path;
- `TRACE`: ordered flow rail with branches nested at their decision point;
- `IMPACT`: `DIRECT`, `INDIRECT`, `VALIDATE`, and `NO EVIDENCE` bands;
- `VERIFY`: contradiction-first verdict rows.

Every relationship in a visual also appears in an evidence table with paths and symbols. Annotate evidence independently as `SOURCE`, `RUNTIME`, `INFERRED`, `UNKNOWN`, or `CONTRADICTED`. Context-escape all dynamic values before inserting them into HTML.

Return a concise chat summary with the direct answer and important unknowns. For file output, also return the absolute path; for response-only, confirm that no report file was created.

**Complete when:** a produced report passes the HTML checks, opens successfully or reports the open failure, and its path is returned; or response-only findings are returned with no file created.

### 7. Offer the optional demo

Offer a demo only when one bounded executable experiment would resolve an important unknown, validate a proposed interface, or make the traced behavior concrete. Present one short demo proposal containing:

- hypothesis;
- observable behavior;
- proposed interface and seam;
- location and files likely to change;
- verification command;
- explicit non-goals.

Ask whether the user wants `isolated demo`, `in-place patch`, or `skip`. Stop before source edits. If the user accepts, follow [references/DEMO.md](references/DEMO.md).

**Complete when:** no qualifying demo exists and none is offered; the user declines; or an approved demo has a recorded contract, implementation evidence, changed-file list, and disposition.

## Parallel investigation

For a broad repository, use parallel read-only subagents only when their scopes are independent. Preflight available capabilities, then make one parallel workflow with distinct lanes such as:

- structure: manifests, bootstrap, entry points, and commands;
- behavior: one named flow and its side effects;
- verification: tests, configuration, callers, and contradictions.

Give every child the repository scope, question, read-only authority, evidence format, and stop condition. Children return evidence reports and do not render the final HTML or spawn agents. The parent reconciles every claim and owns one final report. For a small scope, investigate directly.

## Final check

- Scope, revision, and pre-existing changes are explicit.
- The report answers one reading question rather than touring directories.
- Every material claim has evidence or an uncertainty label.
- Static analysis is not called runtime verification.
- Domain terms and architecture terms are not conflated.
- HTML visuals use the mode-appropriate stable layout; complex relationships fall back to an evidence table rather than crossing lines.
- The report works offline and every dynamic value is context-escaped.
- Project files remain unchanged unless the user approved a durable report path or demo.
- Source code changed only through an explicitly approved demo.
- Demo output, if any, is bounded, executable, and easy to keep or discard.
