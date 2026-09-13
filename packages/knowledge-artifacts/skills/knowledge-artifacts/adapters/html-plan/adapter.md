# html-plan adapter

**Domain**: the structured decision values of a plan / spec / PRD. **Authored** — the artifact itself is the source; nothing to re-derive from.

## The six declarations

1. **Derived or authored** — authored. No provenance.
2. **Seams** — one seam per kind of decision value that gets re-litigated: rendering rules, mapping tables, enum configs, thresholds, field lists. A plan can carry several seams, each with its own contract.
3. **Contract shape** — see [`schema.template.json`](schema.template.json) (the rendering-rules example: match/type/chart/aggregate/maxCategories/colorBy/notes).
4. **Annotation layer** — none. Authored artifacts have no re-run that could clobber human judgment.
5. **Provenance** — none.
6. **Shell** — HTML. The reader compares mockups side by side, navigates sections, sees structure; this is where HTML wins.

## The recipe

1. Run the core gate: name the decision → split frozen/mutable → values vs reasoning → count revisits.
2. **Brainstorm in the shell**, not as eight bullet points in chat — "brainstorm some ideas in an HTML file".
3. When generating the plan, **cut the seams up front** (core SKILL.md, rule 4: the mount point), and place a "edit this section with a micro-app →" anchor.
4. Seams revisited ≥2 times get a micro-app (core `MICRO-APP.md`); the rest keep markers only.
5. Patch with `patch-region.ts apply`; contract changes go through `drift → apply-schema`.

## Worked example

Two files, one seam:
- `plan.html` — frozen layer + `SEAM:rules` (contract + data + mount point + a field table projected from the contract)
- `rules-editor.html` — a disposable micro-app with no field list; everything projects from the contract layer

`MICRO-APP.md` → *The prompt* carries the prompt that produces `rules-editor.html`, and *Verify before you hand it over* is the check that the editor's seed still matches the seam.

Run: `node $S check plan.html` with `S=<skill-dir>/scripts/patch-region.ts`
