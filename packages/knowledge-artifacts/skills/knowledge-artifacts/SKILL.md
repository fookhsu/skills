---
name: knowledge-artifacts
description: "Build knowledge artifacts that survive revision and session boundaries — plans, specs, repo or data analyses, reports. Use when work product must outlive the conversation it was made in, when a document is too long to hold in context, or when an analysis needs to be re-run later without losing human judgment."
license: MIT
---

# Knowledge artifacts

An artifact is worth building when knowledge **does not fit in a conversation and must outlive it**. Everything in this skill follows from one requirement: a fresh agent must be able to (a) open the artifact and get oriented, (b) revise it cheaply and safely, and (c) re-run or resume it without the prior conversation.

Three things make that true, independent of domain:

- **Seams** — marked regions holding the values that change. Everything outside is **frozen**.
- **A contract per seam** — field list, kinds, allowed values. Every consumer projects from it.
- **A checkpoint (META) and provenance (PROVENANCE)** — so a new session can orient, and a derived artifact can say whether it is still true.

The domain-specific part is thin and pluggable: it lives in [`ADAPTERS.md`](ADAPTERS.md). The tool in `scripts/patch-region.ts` is domain-agnostic and reads both HTML and Markdown shells.

## The gate

Six decisions, before writing anything. Each can end the work.

### 1. Name the decision

What will someone decide by reading this?

- **Cannot say in one sentence** → reply in text. No artifact.
- Criterion: *"〈who〉reads it and decides 〈what〉"* stated without hedging.

### 2. Derived or authored?

This is the fork the whole design hangs on.

- **Authored** — a plan, a spec, a decision record. The artifact *is* the source. There is nothing to re-derive from. No provenance needed.
- **Derived** — a repo analysis, a data analysis, test results. A re-runnable procedure produced it, so the artifact is a **cache**, and the source is the *input + the procedure*.

Derived artifacts carry two obligations the authored kind does not:

1. **Provenance** — say what it was generated from and when, so a fresh agent can decide *trust it or re-run it*.
2. **A separate annotation layer** — the human judgments layered on top (an outlier excluded, a module marked for collapse). These must **survive re-runs**; the regenerable facts do not carry them.

### 3. Split frozen from mutable

Walk every section and sort it into one side. When unsure, **freeze** — adding a seam later is cheap; removing one that leaked into prose is not.

### 4. Values or reasoning?

Run each mutable candidate through this. It is where most artifacts go wrong.

- **Values** — enums, numbers, ordering, field lists, thresholds → **seam**.
- **Reasoning** — why, how a requirement should be phrased → **stay as prose**. A form cannot help someone think; it only helps them choose.

### 5. Count the revisits

For each seam, how many times will it be revised?

- **Two or more** → cut a micro-app loose on it: [`MICRO-APP.md`](MICRO-APP.md).
- **Once, or unknown** → emit the markers only. Markers cost nothing and keep every future edit cheap. This is the default.

### 6. Choose the shell

- **HTML** — the reader must navigate, compare, or see structure (architecture report, long plan, dashboard).
- **Markdown** — linear readability and `git diff`/grep matter, or the content is mostly argument.

The seam markers are HTML comments, legal in both, so the choice is about the *frozen* layer only. Do not re-cut seams when the shell changes.

## The generation contract

Five rules. `patch-region.ts check` verifies them mechanically.

**1. The seam declares itself.** Every seam carries a **contract layer** (`<name>-schema`) beside its **data layer** (`<name>-data`). The contract is the interface: field list, each field's kind, allowed values, required/unique, default.

**2. Everything projects from the contract.** The rendered table, the micro-app's controls and labels, the validator, the migration report — all projections. Nothing restates it. This rule breaks most quietly: prose keeps a copy of the type, the editor keeps a copy of the enum lists, the patcher hardcodes a field name — and now one contract lives in three places, waiting to diverge.

**3. Seam markers.** `<!-- SEAM:name -->` … `<!-- /SEAM:name -->`. Layers inside are a `<script type="application/json" id="name-schema">` in HTML, or a ` ```json name-schema ` fence in Markdown.

**4. Mount point.** Beside each seam sits one line: what it holds, when to change it, how it comes back. A seam nobody can find is a frozen section with extra steps.

**5. The shell is self-contained and a projection.** No build step to read the artifact; the frozen prose/rendering reads the seam, never the other way around.

## The checkpoint (META)

A reserved block that lets a new session orient **without the prior conversation**:

```html
<!-- META -->
{ "title": "…", "purpose": "…", "status": "draft | decided | in-progress | stale",
  "next": "…", "done-when": "…", "decisions": ["…"] }
<!-- /META -->
```

- `next` and `done-when` are fields, not prose — that is what makes resume a *read*, not a reconstruction.
- `decisions` is the log of what is already settled, so a fresh agent does not re-litigate it.
- `status: stale` is the signal the author sets when they know the artifact has drifted.

## Provenance (PROVENANCE)

Required for **derived** artifacts; meaningless for authored ones.

```html
<!-- PROVENANCE -->
{ "generated-from": "data/churn.csv", "generated-at": "2026-09-13T10:00:00Z",
  "procedure": "python analyze.py data/churn.csv" }
<!-- /PROVENANCE -->
```

`patch-region.ts stale` compares `generated-from` against `generated-at` and reports STALE when the input has moved on. A derived artifact without provenance is a lie waiting to be caught: it describes a repo or dataset that may no longer be what it analyzed.

## Patch protocol

```bash
S=<this skill>/scripts/patch-region.ts

node $S list    <file>            # seams + checkpoint + provenance at a glance
node $S check   <file>            # validate each seam against its contract
node $S meta    <file>            # resume entry point: read this first in a new session
node $S stale   <file>            # whether a derived artifact is stale
node $S schema  <file> <seam>
node $S extract <file> <seam> > x.json
node $S diff    <file> <seam> x.json
node $S apply   <file> <seam> x.json
node $S drift        <file> <seam> new-schema.json
node $S apply-schema <file> <seam> new-schema.json
```

Below the script, the discipline:

1. **`meta` is the entry point.** A new session reads the checkpoint first, the seam second.
2. **Extract before editing; diff before applying; re-extract and assert after applying.** The loop closes only when reading the value back returns what was written.
3. **Never edit the shell to change a seam's values.** Reaching into prose means the seam was cut wrong — recut it, don't patch around it.

## Changing the contract

A contract change is the case that used to force full regeneration. Declared, it becomes a list.

`drift` enumerates the four ways a contract change lands on data:

| Change | Reported as |
|---|---|
| **Added field** | how many rows are missing a value (optional→required rides this too) |
| **Removed field** | how many rows carry the value that will be dropped |
| **Narrowed enum** | which rows used a removed option — **must be remapped; the machine cannot decide for you** |
| **Type change** | the field's old/new kind, and which rows the tightened min/max breaks |

Then migrate the data, `apply` it, `apply-schema`. **The contract cannot land ahead of its data** — `apply-schema` refuses while unresolved items remain (`--force` to override).

**The shell needs zero edits.** It was a projection, so it re-renders on reload. A micro-app regenerates its seed only — its code carries no field list.

## Reference

- **Adding or writing a domain adapter** → [`ADAPTERS.md`](ADAPTERS.md).
- **Cutting a disposable editor loose on a seam** → [`MICRO-APP.md`](MICRO-APP.md).
