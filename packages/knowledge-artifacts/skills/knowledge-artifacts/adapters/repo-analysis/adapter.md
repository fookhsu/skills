# repo-analysis adapter

**Domain**: the structure / quality / architecture analysis of a code repository. **Derived** — the analysis is a function of the repo; conclusions go stale the moment the repo moves.

## The six declarations

1. **Derived or authored** — derived. The artifact is a cache; the source is the repo + the procedure.
2. **Seams** — at least two, one regenerable and one human judgment:
   - `modules` — the module catalog (regenerable). Rebuilt on every run.
   - `findings` — observations and judgments (**annotation layer**). Must survive re-runs.
3. **Contract shape** — see [`schema.template.json`](schema.template.json). The key field is `modules.hash` (a fingerprint of module content), which lets the tool tell when a judgment's basis has moved.
4. **Annotation layer** — `findings`. Every finding keys to a `module.path` + its `hash`; when a re-analysis sees a changed hash, the finding is flagged for review instead of silently clobbered. Findings carry a `polarity` — **positive** findings (a deep module worth preserving) are first-class, not an afterthought.
5. **Provenance** — `generated-from` = repo path or HEAD, `procedure` = the analysis command (or a summary of the prompt).
6. **Shell** — HTML (an architecture report needs navigation + diagrams); a flat catalog is fine in Markdown. The seam markers work in both.

## The recipe

1. Run the gate; land on the **derived** branch — a repo analysis without provenance is a lie waiting to be caught.
2. Analyze `modules` first (path / responsibility / depth / hash), then `findings` (polarity / judgment / severity / reason), keying findings to modules.
3. Use the `codebase-design` vocabulary for `judgment`, but **keep both poles**: `deep` is the positive judgment; `shallow-wrapper`, `interface-leak`, `missing-seam`, `low-leverage`, `poor-locality` are the negatives. A findings list of only problems is not an analysis.
4. On re-analysis: only re-examine modules whose `hash` changed (incremental); keep `findings` intact, and mark the ones whose basis moved as `status: recheck`.
5. `patch-region.ts stale` judges the whole artifact; `drift` handles contract changes.

## Relation to codebase-design

Judgment vocabulary reuses `/codebase-design` terms (deep / shallow / seam / leak / leverage / locality). This adapter does not redefine them — it lands them as enum values on the findings seam.
