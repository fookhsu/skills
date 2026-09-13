# Report draft

`report-draft.md` is the editable content source rendered later into `report.html` by [HTML-REPORT.md](HTML-REPORT.md). It is content-only Markdown: no CSS, no inline SVG, no HTML chrome, and no escaped HTML. Diagrams are stored as a spec — a fenced `mermaid` source block, or a compact structured list naming the pattern and its items — never as rendered markup.

The draft is the single source of truth for report content. The HTML report is a deterministic projection of the draft plus a fixed scaffold: rendering never re-authors content, and re-rendering the same draft reproduces the same HTML.

## Front-matter

```yaml
---
repository: /absolute/repository/path
revision: <full revision>
scope: <investigation scope>
mode: ORIENT | TRACE | IMPACT | VERIFY
lens: behavior | module | data | change | evidence
primary-visual: architecture-tracks | flow-rail | sequence-lifelines | impact-bands | verdict-rows | mass-diagram | mermaid:<type> | inline-svg
emphasis: <one-line note on the current lens emphasis; optional>
---
```

`mode`, `lens`, and `primary-visual` are the presentation intent: changing a lens edits these fields plus the affected sections, never the HTML. HTML staleness is recorded in `investigation-map.md`, not in the draft.

## Sections

Mirror the report structure in [HTML-REPORT.md](HTML-REPORT.md), one `##` section each, in order. Include only sections the selected mode needs. The header metadata lives in the front-matter, not a body section.

1. **Direct answer** — one compact statement answering the reading question.
2. **Workflow and coverage** — stage/mode/lens position, coverage totals, next frontier, link to `investigation-map.md`.
3. **Primary visual** — the diagram spec, labeled with its pattern (a fenced Mermaid source block, or a structured list of tracks, flow steps, lifelines, bands, verdict rows, or mass figures).
4. **Relationship evidence** — a Markdown table: source module, relationship, target module, linked paths/symbols, evidence status.
5. **Module details** — responsibility, interface, hidden implementation, seam, adapters, dependencies, and linked source symbols.
6. **Domain concepts summary** — only terms required for the answer plus a link to `domain-concepts.md`.
7. **Reading path or checks** — dependency-ordered paths for `ORIENT`, or focused checks for the other modes.
8. **Unknowns and frontier** — unresolved facts, deliberately unread scope, and the next highest-value slice.

Keep the draft below 1,000 lines (target 300–400). It stays small because it carries content and no scaffold.
