# Adapters

The core skill and the tool are domain-agnostic. Everything that varies by domain is an **adapter**: a self-contained directory under `adapters/` that the core never needs to know about. Adding a domain = adding a directory. Deleting a domain = deleting a directory. Nothing else changes.

## What an adapter is

A thin, declarative package. It answers the one question the core cannot:

> **What, in this domain, is the mutable state — and what is the human judgment that must survive regeneration?**

Concretely, an adapter is a directory containing:

```
adapters/<name>/
├── adapter.md              # recipe: how this domain runs the gate, how seams are cut
└── schema.template.json    # the contract template for each seam (the shape of what changes)
```

It may also carry a worked example (a full artifact) and a micro-app template, but those are examples, not interface.

## The interface (what `adapter.md` must declare)

An adapter's recipe answers six things. Missing any of them is a red flag that the domain is not actually adapted — it is being forced into a template it does not fit.

1. **Derived or authored?** — does a re-runnable procedure produce it, or is the artifact itself the source?
2. **Which seams?** — name each seam and what kind of value it holds. Derived domains need at least two: the *regenerable facts* and the *human annotations*.
3. **The contract shape** — the `schema.template.json` for each seam.
4. **The annotation layer** — for derived domains, which seam carries judgments that re-runs must not clobber, and how it keys onto the regenerable facts (e.g. a `hash` on a module record, so the tool can tell the judgment's basis has moved).
5. **Provenance** — for derived domains, what `generated-from` points at (repo HEAD, data file + version, a command) and the regeneration `procedure`.
6. **Shell** — HTML or Markdown, and why. The seam markers work in both, so this is a frozen-layer decision only.

## The invariants the adapter must NOT redeclare

The core already owns: the gate, the contract/data/prose split, the seam markers, the checkpoint, the patch/migrate protocol, the micro-app mechanism, the tool. An adapter that restates any of these is a second source of truth.

The adapter owns only: *what changes in its domain* and *what shape that change has*.

## Adding an adapter

1. Create `adapters/<name>/` with `adapter.md` + `schema.template.json`.
2. Fill the six declarations above.
3. If the domain is derived, provide a provenance example and an annotation layer whose records key onto regenerable facts (usually by a content hash or an id that survives re-runs).
4. Point `adapter.md` at one worked example so the recipe is a reading, not a theory.
5. Stop. The core and the tool are untouched.

## The shipped adapters

| Adapter | Derived/authored | What changes | Annotation layer | Shell |
|---|---|---|---|---|
| [`html-plan`](adapters/html-plan/adapter.md) | authored | decision values in a plan (rules/config/enums) | — | HTML (visual review) |
| [`repo-analysis`](adapters/repo-analysis/adapter.md) | derived | module catalog + findings | `findings` (judgments, keyed by module hash) | HTML or MD |
| [`data-analysis`](adapters/data-analysis/adapter.md) | derived | metric results + decisions | `decisions` (exclude/keep/recheck) | HTML or MD |
