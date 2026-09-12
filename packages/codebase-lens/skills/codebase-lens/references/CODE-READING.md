# Code-reading framework

Select the lens named by the mode, then consult another lens only when it materially answers the reading question. The evidence lens applies to every mode; broad `ORIENT` normally uses all five.

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

## Vocabulary bridge

Capture terms that a new contributor, user, and future agent need to communicate:

| Field | Meaning |
|---|---|
| Canonical term | Preferred project term |
| Code names and aliases | Identifiers, acronyms, legacy names, or UI labels |
| Meaning and limits | What it includes and what it must not be confused with |
| Lifecycle/relationships | States, ownership, parents, or related concepts |
| Evidence | Source, docs, schema, tests, or user confirmation |
| Status | `CONFIRMED`, `CANDIDATE`, `AMBIGUOUS`, or `CONTRADICTED` |

Use `CONFIRMED` only with source, documentation, schema, tests, or explicit user clarification. Preserve collisions such as one word naming two concepts. Keep implementation locations in evidence instead of turning the vocabulary table into a file catalog.

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

Stop exploring when the primary question and each material relationship are supported, contradicted, or marked unknown. More files without a sharper question are not more understanding.
