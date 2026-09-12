# Code-reading framework

Select the lens named by the mode, then consult another lens only when it materially answers the reading question. The evidence lens applies to every mode; broad `ORIENT` normally uses all five. Record the active stage, mode, lens, reading frontier, and exact coverage in [INVESTIGATION-MAP.md](INVESTIGATION-MAP.md); maintain domain language separately under [DOMAIN-CONCEPTS.md](DOMAIN-CONCEPTS.md).

## 1. Behavior lens

Trace one real behavior in causal order:

```text
entry → registration → input parsing → policy/validation → orchestration
      → state or external effects → output → error handling
```

At each node record:

| Field | Question |
|---|---|
| File and symbol | Where is the behavior defined or registered? |
| Role | Why is this node in the flow? |
| Input/output | What crosses into and out of it? |
| State/effects | What changes or leaves the process? |
| Conditions | What selects this branch? |
| Evidence | How is the claim known? |

Registration matters. A handler that exists but is never wired into the running application is not an entry point.

## 2. Module lens

Map behavior into modules by interface and responsibility, not by directory count. Read [ARCHITECTURE.md](ARCHITECTURE.md) before naming or evaluating modules.

Ask:

- What must callers know?
- What implementation does the interface hide?
- Where can behavior vary without editing the caller?
- Which adapter occupies that seam in production and in tests?
- Where do change, bugs, and verification concentrate?

Describe the current architecture before recommending a different one.

## 3. Data lens

Follow important data as carefully as calls:

- creation and identity;
- validation and invariants;
- ownership and authorization;
- state transitions;
- serialization and compatibility;
- transaction boundaries;
- persistence, caching, and invalidation;
- emitted events and downstream consumers;
- deletion and retention.

A type definition establishes shape, not lifecycle. A migration establishes storage shape, not every runtime invariant. A test establishes only the behavior it asserts.

## 4. Change lens

For impact analysis, walk both directions from the target.

**Toward callers:** imports, calls, implementations, subclasses, registrations, public exports, routes, commands, events, templates, and user-facing labels.

**Toward effects:** shared types, schemas, serialized formats, tables, external requests, queues, caches, permissions, build targets, deployment units, and tests.

Classify each finding:

- `DIRECT` — a concrete relationship reaches the target.
- `INDIRECT` — a supported chain reaches the target through another module.
- `VALIDATE` — plausible relevance that needs a check.
- `NO EVIDENCE` — searched, but no relationship was found.

Absence of search results is not proof of no runtime relationship when reflection, generated code, configuration, plugins, or dependency injection can create dynamic edges.

## 5. Evidence lens

Attach one status to every material conclusion:

- `SOURCE` — directly established by source code, configuration, schema, or project documentation. Cite path and symbol or section.
- `RUNTIME` — directly observed by executing a command. Record command, exit status, and relevant result.
- `INFERRED` — supported by multiple signals but not directly established. State the signals.
- `UNKNOWN` — the repository or available environment cannot answer it.
- `CONTRADICTED` — sources disagree. Show both observations without silently choosing one.

Evidence strength is claim-specific. A passing test is `RUNTIME` evidence that the asserted scenario passed, not proof of every production path.

## Reconnaissance order

Read landmarks before broad source areas:

1. Project instructions, `README`, `CONTEXT.md`, and relevant ADRs.
2. Package/workspace manifests and lockfiles.
3. Build, start, test, lint, and code-generation configuration.
4. Executable bootstrap and registration sites.
5. Routes, command registries, event consumers, scheduled jobs, or exported library interfaces.
6. Schemas, migrations, ORM mappings, and external adapters.
7. Tests nearest the selected behavior.
8. Implementation files selected by the trace.

Use directory listings and targeted searches to pick the next file. Skip vendored dependencies, generated output, caches, coverage, and build artifacts unless the question concerns them.

## Stack search priorities

These are search priorities, not assumed architectures.

| Project type | Inspect first | Typical trace |
|---|---|---|
| Browser UI / React / Vue / Angular | bootstrap, routes, pages, state, data client | route → screen → state/query → request → render |
| Next.js or another full-stack web framework | route conventions, server/client split, actions/loaders, middleware | route → middleware → loader/action → domain behavior → render/response |
| Node server / Express / NestJS | bootstrap, registration, middleware, handlers, persistence adapters | request → middleware → handler → orchestration → effect |
| Django / Flask / FastAPI | app factory, settings, routers/views, dependencies, models, tasks | request → auth/dependency → handler → domain behavior → effect |
| Spring | application/configuration, filters, controllers, repositories, entities | request → filter → controller → orchestration → repository |
| Go | `cmd`, `main`, router, handlers, internal packages, migrations | process → middleware → handler → domain behavior → store |
| Rust | workspace, binaries, `main`/`lib`, traits, handlers, adapters | binary → interface/trait seam → behavior → adapter |
| Rails | routes, controllers, models, jobs, initializers | route → controller → domain behavior → job/response |
| Mobile | bootstrap, navigation, screens, state, repositories, platform adapters | app start → navigation → screen → state → effect |
| CLI | executable, argument parser, command registry, configuration | process → parser → command → behavior → output |
| Library / SDK | public exports, package entry, examples, contract tests | caller interface → core behavior → transport/adapter |

For an unlisted or polyglot stack, derive priorities from actual manifests, executable boundaries, registrations, and tests.

## Bounded source slices

Measure a candidate source file before reading it as a whole. Use `wc -l`, an equivalent metadata operation, or an editor/LSP index before requesting file contents.

- Treat a file over 1,000 physical lines as a container, never as one reading unit.
- Index declarations, exports, registrations, tests, or references first; select only the symbols that advance the current question.
- Default to at most 400 aggregate source lines across one slice. `slice-lines` may change that budget but cannot exceed 1,000; each read consumes the remaining slice budget.
- Prefer complete symbol bodies with the context needed to establish inputs, outputs, branches, and effects. Use bounded line ranges only when symbol-aware navigation is unavailable.
- Record every inspected symbol or range as `READ` and its containing large file as `PARTIAL`. Preserve uninspected ranges as `UNREAD`; reading one function never marks the file complete.
- Put newly discovered callers or dependencies onto the investigation-map frontier rather than following them after the slice budget is exhausted.

Generated project code follows the same size rule when it is relevant. Vendored, cached, and build output may instead be marked `SKIPPED` with a reason.

## Source links

Every named source symbol in generated Markdown or HTML—including functions, methods, classes, types, constants, handlers, registrations, and schema declarations—must be a clickable link. The visible label also includes the repository-relative `path:start-end` location so evidence remains usable when the link cannot open.

Resolve links in this order:

1. Prefer a recognized repository-host URL pinned to the full investigated revision and exact line range, such as a GitHub `blob/<revision>/<path>#Lx-Ly` URL.
2. Otherwise link the absolute local file URI and show the exact line range in text. Do not claim that a browser-only file URI can select a line.
3. For generated or dynamically registered symbols without their own stable source location, link the generator or registration site and label the symbol location `UNKNOWN`.

Encode path segments and HTML attributes correctly. Verify the path, symbol, and line range against the recorded revision before emitting a link; never guess a URL or line number. Documentation sections may use their own stable anchors, but do not present a documentation link as source-code evidence.

## Domain language

Maintain the complete vocabulary bridge in the separate generated `domain-concepts.md` artifact defined by [DOMAIN-CONCEPTS.md](DOMAIN-CONCEPTS.md). The HTML report contains only a compact summary and a link. The investigation map contains only the document link and vocabulary-related frontier items, not concept definitions.

## Mode-specific completion

### `ORIENT`

- Apply the module-map scale rule in [ARCHITECTURE.md](ARCHITECTURE.md).
- Give each included module a responsibility, interface, dependencies, paths/symbols, and evidence.
- Trace the primary startup or request/command behavior.
- Recommend no more than 12 files in dependency order, each with a reason.

### `TRACE`

- Name the exact URL, command, page, event, job, type, or symbol.
- Show the ordered happy path plus important branch and error paths.
- Include authorization, transactions, retries, caching, and side effects when they exist.
- Mark dynamic dispatch that static reading cannot resolve.

### `IMPACT`

- Identify the exact target and revision or diff range.
- Separate direct and indirect relationships.
- Include contracts outside code: database, wire formats, config, permissions, deployment, and compatibility.
- Name focused unit, integration, contract, and end-to-end checks that cover the path.

### `VERIFY`

Use evidence independent of the original explanation:

- reverse the trace from output to entry;
- compare runtime registration with implementation;
- compare test inputs/assertions with claimed behavior;
- run a focused existing command when safe;
- inspect generated/configuration-driven edges separately.

Lead with contradictions and keep unresolved edges explicit.

## Stop rule

Stop a slice when its file or line budget is exhausted. Stop the investigation when the primary question and each material relationship are supported, contradicted, or marked unknown, or when `max-slices` or `stop-after` is reached. In every case, update the investigation map with exact `READ`, `PARTIAL`, and `UNREAD` coverage plus the next frontier item. More files without a sharper question are not more understanding.
