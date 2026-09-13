# data-analysis adapter

**Domain**: the analysis of a dataset (metrics, distributions, outliers, trends). **Derived** — the analysis is a function of the data.

## The six declarations

1. **Derived or authored** — derived. The artifact is a cache; the source is the data + the procedure.
2. **Seams** — two, one regenerable and one human judgment:
   - `result` — metric results (regenerable). Rebuilt on re-run.
   - `decisions` — human judgments (**annotation layer**): which outliers to exclude, which to keep, which to recheck. Must survive re-runs.
3. **Contract shape** — see [`schema.template.json`](schema.template.json).
4. **Annotation layer** — `decisions`, each keyed to a `target` (an outlier, a metric, a time window). A re-run diffs `result` only; `decisions` stay in place. This is the answer to "I hand-fixed a number last time — does that survive new data?" — the fix is recorded as a decision, so a fresh session can see it and re-judge it.
5. **Provenance** — `generated-from` = data file + version, `procedure` = the analysis command. `patch-region.ts stale` reports when the data is newer than the conclusions.
6. **Shell** — HTML if a dashboard is wanted; Markdown for conclusions + a decision log. The seam markers work in both.

## The recipe

1. Run the gate; land on the **derived** branch.
2. Fix the question → the data source + version → the procedure → produce `result` + `decisions`.
3. Put the question in META's `purpose`; put "every outlier has a decision" in `done-when`.
4. On re-run: bump `generated-from` version → recompute `result` → `diff` against the old → leave `decisions` in place, marking only the ones whose basis moved as `recheck`.
5. Contract changes (new metric, new decision type) go through `drift → apply-schema`.

## Worked example

A minimal acceptance fixture is a Markdown artifact with two seams + META + PROVENANCE whose `generated-from` points at the data file. With `S=<skill-dir>/scripts/patch-region.ts`: run `node $S check <file>`, touch the data file, then run `node $S stale <file>` and confirm it reports STALE.
