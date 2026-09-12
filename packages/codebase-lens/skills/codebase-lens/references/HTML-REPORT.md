# Artifact workspace and HTML report

A file-producing investigation uses one workspace containing a resumable investigation map, a separate domain-concepts document, and the final self-contained HTML report. Chat receives the direct answer, important unknowns, coverage summary, and absolute paths to every produced artifact.

## Output decision

Choose exactly one branch:

| `workspace` value | File behavior | Resume and open behavior |
|---|---|---|
| `docs` (default) | Create or reuse `docs/codebase-lens/` under the current directory, containing `investigation-map.md`, `domain-concepts.md`, and eventually `report.html` | Durable and resumable; open `report.html` unless `open=false` |
| `temp` | Securely create one fresh OS-temporary directory with the same three files | Resumable while the directory exists; open `report.html` unless `open=false` |
| `response-only` | Write no files | Not resumable from disk; return compact position, coverage, domain terms, and findings in chat |
| Approved directory | Create or resume artifacts only in that exact directory | Durable and resumable; open `report.html` unless `open=false` |

Writing investigation artifacts under the current directory is a project-file edit: approval covers investigation artifacts only, not source edits. The default `docs` location resolves to `docs/codebase-lens/` and is pre-approved by convention; a custom directory is approved by naming it explicitly. Do not also create a temporary copy unless the user requests both. A `resume=<map-path>` selects the existing map's parent directory and takes precedence over `workspace`.

For `docs` (the default), create or reuse `docs/codebase-lens/` under the current directory using the three canonical filenames:

```text
<current-directory>/docs/codebase-lens/
├── investigation-map.md
├── domain-concepts.md
└── report.html
```

Never overwrite an unrelated file already in `docs/codebase-lens/`. If the three files already exist from an earlier investigation, resume them instead of clobbering, after verifying the map's repository and revision. Suggest adding `docs/codebase-lens/` to `.gitignore` when these are local working artifacts.

For `temp`, use the operating system or standard-library temporary-directory facility with a random suffix and exclusive file creation:

```text
<tmpdir>/codebase-lens-<repo>-<mode>-<timestamp>-<random>/
├── investigation-map.md
├── domain-concepts.md
└── report.html
```

Sanitize `<repo>` and `<mode>` to lowercase ASCII letters, numbers, and hyphens. A suitable implementation uses Node `fs.mkdtemp`, Python `tempfile.mkdtemp`, or an equivalent OS-backed primitive. Create files without overwriting an unrelated artifact; on resume, verify the map's repository and revision before updating it.

Use relative links among the three artifacts so moving a durable workspace preserves navigation. Open only the report, passing its absolute path as one argument to `open` on macOS, `xdg-open` on Linux, or `start`/`Start-Process` on Windows. Use an argument array such as Node `spawn(command, [path])` or Python `subprocess.run([command, path])`; never concatenate a shell command. If opening fails, keep every artifact and state the failure with their absolute paths.

## Rendering contract

Open [HTML-REPORT-PREVIEW.html](HTML-REPORT-PREVIEW.html) before rendering. It is the visual reference for the complete background ladder, allowed color ranges, red budget, Mermaid treatment, and every supported diagram type. A generated report selects only diagrams useful to its question; it does not reproduce the gallery.

- Produce valid standalone HTML5 with UTF-8, viewport metadata, and inline CSS; no build step is required to view the artifact.
- Use semantic HTML, CSS Grid/Flexbox, inline SVG, or client-rendered Mermaid for diagrams. Mermaid is a first-class option across its diagram types, themed from the same token block so it matches the palette and the dark scheme; see "Mermaid diagrams".
- Do not use Markdown diagrams, Tailwind, or web fonts. CDN assets are allowed only for the Mermaid runtime (`mermaid.js`); pin a specific version so rendering is reproducible. Every other resource stays local.
- Context-escape every non-template value before inserting it into HTML, including user input, repository content, paths, command output, labels, generated prose, and source-link attributes. Escape text nodes and quoted attributes separately; at minimum text must encode `&`, `<`, and `>`, while attributes must also encode the active quote character. Never interpolate dynamic raw HTML or place dynamic values in `<style>`, `<script>`, URL-valued attributes, or event-handler attributes.
- Follow the source-link contract in [CODE-READING.md](CODE-READING.md). Every named source symbol is a clickable, verified link with visible repository-relative path and line range; artifact-to-artifact links are relative.
- Keep each generated file below 1,000 physical lines without minifying or collapsing readable structure to evade the limit. Compact the report and move full coverage or terminology into their dedicated artifacts; shard domain concepts as specified by [DOMAIN-CONCEPTS.md](DOMAIN-CONCEPTS.md).
- Executable JavaScript is limited to rendering Mermaid diagrams — including the bootstrap that reads the token block — plus any interaction the user explicitly requests. Include no other scripts. Prefer `<details>` for disclosure when interaction is not needed.
- Keep the report readable at 360px and at desktop widths. Tables use horizontal overflow containers; long paths wrap with `overflow-wrap:anywhere`.
- Use color as a secondary signal that serves the reading question, and give every status visible text as well.
- Color marks a claim about evidence, never decoration. Reserve the evidence accents for evidence and verdict; if a color does not change what the reader should trust or check next, remove it.
- The scaffold reserves every evidence accent for evidence and verdict: `source` is the neutral default and carries no accent; `runtime` is the one calm blue accent; `inferred`, `unknown`, `unresolved`, and `validate` are amber; `contradicted` is red; `confirmed` and `badge-strong` are green. Structural chrome — step numbers, sequence numbers, participant rules, table headers — stays neutral.
- The architecture map is the one place color encodes category instead: it colors **by track**, one color per track with no per-module variation, drawn from the closed four-slot category palette below. Never put an evidence accent on an architecture module, and never put a category color outside the architecture map, so no color ever carries two meanings.
- Match the preview's clean editorial visual language: a cool white-blue canvas and paper-white panels in light mode; a clear ink-blue canvas, lighter navy panels, and blue-gray recesses in dark mode. Keep the background ladder visibly separated rather than gray-green or foggy.
- Keep the tonal ladder flat (`--bg` canvas, `--surface` panel, `--line` border, `--grid` recess) instead of shadows and gradients. Pair every accent with its translucent `-fill` tint so filled surfaces stay soft while strokes and labels remain clear.
- Draw category colors only from the closed four-slot range: bright sky blue, iris violet, honey amber, and clear lagoon teal, in that order. Raise clarity through the stroke, not through large saturated fills.
- Treat red as scarce: use it only for contradiction, failure, leakage, or a critical path; use amber for unresolved or cautionary states; and keep red fill paler than every structural surface.
- Keep it flat at rest; a shadow must explain layering or state. No nested cards, no identical card grids, no glass, no gradient text.
- Keep chrome mono-forward and small: the `--mono` stack for code, paths, and symbols; 11px uppercase labels with `0.1em` tracking for metadata and section headings; prose in the system sans stack at 15px/1.6. Never load a web font.
- Keep corners at `--radius` (8px) for panels and `--radius-sm` (5px) for chips and controls.
- Theme parity: the scaffold switches to a dark scheme under `prefers-color-scheme`. Keep both schemes legible, and define every color in the token block rather than as an inline hex.

## Stable diagram patterns

The report must choose a pattern that fits the relationship. Do not force a freeform graph onto every question. The CSS patterns below remain the default for simple structure; use Mermaid (client-rendered, see "Mermaid diagrams") when a freeform connector, branching, or a lifeline sequence is genuinely needed.

### Architecture: fixed tracks

Use a three- or four-track CSS grid such as **Entry**, **Core behavior**, **State**, and **External effects**. Put each module in exactly one track. Show the dominant direction from left to right on desktop and top to bottom on narrow screens. Select the matching `tracks-3` or `tracks-4` class; the number of track sections and arrow elements must match it.

The track position already carries a module's role, so give the whole track one color rather than repeating the role on each module. Add `track-1` … `track-4` to the track sections in left-to-right order; every track sets `--cat` and `--cat-fill` for its subtree, so the rail, the heading, and every module inside share that one color automatically.

| Class | Slot | Light | Dark |
|---|---|---|---|
| `track-1` | first track | `--cat-1` sky blue | `--cat-1` |
| `track-2` | second track | `--cat-2` iris violet | `--cat-2` |
| `track-3` | third track | `--cat-3` honey amber | `--cat-3` |
| `track-4` | fourth track | `--cat-4` lagoon teal | `--cat-4` |

Those four tokens are the complete architecture palette. Do not introduce a fifth, do not add a color class to an individual module, and do not give two modules in one track different colors. Carry evidence status in the module's text or a `.status` chip instead, so the category palette and the evidence palette never meet in one view.

```html
<div class="architecture tracks-3" aria-label="Architecture map">
  <section class="track track-1">
    <h3>Entry</h3>
    <div class="module source"><strong>HTTP adapter</strong><span>registers routes</span></div>
  </section>
  <div class="track-arrow" aria-hidden="true">&#8594;</div>
  <section class="track track-2">
    <h3>Core behavior</h3>
    <div class="module source"><strong>Order intake</strong><span>validate &#183; price &#183; commit</span></div>
    <div class="module"><strong>Pricing</strong><span>returns a quote — role inferred, not confirmed</span></div>
  </section>
  <div class="track-arrow" aria-hidden="true">&#8594;</div>
  <section class="track track-3">
    <h3>State</h3>
    <div class="module source"><strong>Order store</strong><span>persists committed orders</span></div>
  </section>
</div>
```

This layout is intentionally coarse. Put secondary and cyclic relationships in the relationship table instead of drawing crossing lines.

### Flow: ordered rail

Render a causal flow as an `<ol>`. Each node gets a fixed sequence number, concise title, role, file/symbol, side effect, and evidence status. CSS supplies the connecting rail; the DOM order remains meaningful without styling.

```html
<ol class="flow" aria-label="Request flow">
  <li class="flow-step source">
    <span class="step-number">1</span>
    <div><strong>Route registration</strong><a href="REVISION_PINNED_SOURCE_URL"><code>src/http.ts:12-28 · register</code></a></div>
  </li>
  <li class="flow-step inferred">...</li>
</ol>
```

Put branches directly under the node that selects them, using a nested `.branches` block. Keep the main rail linear; do not draw return arrows across the page.

### Sequence: participant lifelines

Render a call/return lifecycle across participants as a CSS grid: one header column per participant, messages as numbered rows with a `from → to` route and a label. Use this for `TRACE` or any question whose answer is the ordered lifecycle of key functions. Label participants and messages with `CONFIRMED` domain concepts from [domain-concepts.md](DOMAIN-CONCEPTS.md), not ad-hoc identifiers.

```html
<div class="sequence" aria-label="Order lifecycle">
  <div class="seq-participants">
    <div class="seq-participant">HTTP adapter</div>
    <div class="seq-participant">Order intake</div>
    <div class="seq-participant">Pricing</div>
  </div>
  <div class="seq-message">
    <span class="seq-num">1</span>
    <span class="seq-route">HTTP adapter <span class="seq-arrow">&#8594;</span> Order intake</span>
    <span class="seq-label"><code>submit(cart)</code> · validate</span>
  </div>
  <div class="seq-message">
    <span class="seq-num">2</span>
    <span class="seq-route">Order intake <span class="seq-arrow">&#8594;</span> Pricing</span>
    <span class="seq-label"><code>price(cart)</code> · returns quote</span>
  </div>
</div>
```

Each message names the concrete function, its lifecycle phase (`register`, `validate`, `execute`, `emit`, `commit`, `cleanup`), and any material return value. Keep the fewest participants that explain the sequence. Note a return in the label instead of drawing a return arrow unless the return is itself the finding. This is the CSS alternative to a Mermaid `sequenceDiagram`; use Mermaid when activations, `alt`/`opt`/`loop` fragments, or parallel lifelines would make the grid unreadable.

### Impact: radial lists with a recommendation strength

Use four adjacent bands labelled `DIRECT`, `INDIRECT`, `VALIDATE`, and `NO EVIDENCE`. Each item states the concrete relationship, its independent evidence status, and a **recommendation strength** badge.

Strength is a third, independent axis: it rates how strongly the evidence supports acting on the item before changing the target. It is not the relationship class (`DIRECT` … `NO EVIDENCE`) and not the evidence status (`SOURCE` … `CONTRADICTED`). Keep all three visible; do not collapse them into one label.

| Badge | Meaning | Accent |
|---|---|---|
| `Strong` | Act on it before changing the target | green |
| `Worth exploring` | Confirm it with the named check first | amber |
| `Speculative` | Hypothesis; no supporting evidence found | muted |

```html
<div class="impact-grid">
  <section class="impact-band">
    <h3>DIRECT</h3>
    <div class="module source">
      <strong>Order intake</strong>
      <span>reads <code>Run.status</code></span>
      <p><span class="status badge-strong">Strong</span> <span class="status">SOURCE</span></p>
      <a href="REVISION_PINNED_SOURCE_URL"><code>src/orders/intake.ts:42-58</code></a>
    </div>
  </section>
</div>
```

Name the focused check that would settle each `Worth exploring` item.

### Interface depth: mass diagram

When depth is material, use paired rectangles: a short interface band over an implementation body. Compare modules side by side only when dimensions mean the same thing. Label the caller knowledge represented by the interface; do not imply a line-count metric.

```html
<div class="mass">
  <figure>
    <div class="iface h-lg">interface</div>
    <div class="impl h-xl">implementation</div>
    <figcaption>Before — shallow</figcaption>
  </figure>
  <figure>
    <div class="iface h-sm">interface</div>
    <div class="impl h-xl">implementation</div>
    <figcaption>After — deep</figcaption>
  </figure>
</div>
```

### Verification: verdict rows

Use one row per claim with `CONFIRMED`, `CONTRADICTED`, or `UNRESOLVED`, followed by the independent evidence. Put contradictions first. Reuse the semantic container classes so the row inherits the status accent:

```html
<div class="module contradicted">
  <strong>Every production write goes through SearchStore</strong>
  <span><span class="status">CONTRADICTED</span> <code>src/indexer/rebuild.ts:88</code> writes directly</span>
  <a href="REVISION_PINNED_SOURCE_URL"><code>src/indexer/rebuild.ts:80-96</code></a>
</div>
```

### Mermaid diagrams

Mermaid is the workhorse for graph-shaped relationships: calls, dependencies, branching, state transitions, and complex lifelines. CSS and inline SVG handle editorial visuals whose meaning depends on exact mass, fixed tracks, cross-sections, or before/after geometry. Mix them deliberately; a report made entirely of Mermaid becomes generic, while forcing freeform graph relationships into positioned HTML becomes fragile.

Usable Mermaid types include `flowchart`/`graph`, `sequenceDiagram`, `stateDiagram-v2`, `classDiagram`, `erDiagram`, `block`, `timeline`, `mindmap`, `journey`, and `gantt`; `subgraph` blocks are allowed. Pick by relationship rather than variety: a lifecycle is a `sequenceDiagram`, a state machine is a `stateDiagram-v2`, stored shape is an `erDiagram`, and a branching call graph is a `flowchart`. Mermaid renders client-side, so the report is not guaranteed to work fully offline; load the pinned runtime and keep a CSS pattern as the graceful fallback where offline use matters.

**Theme the runtime from the token block.** Read the CSS custom properties and pass them to `mermaid.initialize`, so a diagram matches the report palette and follows the dark scheme instead of fighting it:

```html
<script type="module">
  import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@11.4.1/dist/mermaid.esm.min.mjs";
  var css = getComputedStyle(document.documentElement);
  var v = function (name) { return css.getPropertyValue(name).trim(); };
  mermaid.initialize({
      startOnLoad: true,
      securityLevel: 'strict',
      theme: 'base',
      fontFamily: v('--mono'),
      themeVariables: {
        darkMode: matchMedia('(prefers-color-scheme: dark)').matches,
        background: v('--surface'),
        primaryColor: v('--surface'),
        primaryTextColor: v('--ink'),
        primaryBorderColor: v('--line'),
        secondaryColor: v('--grid'),
        tertiaryColor: v('--bg'),
        textColor: v('--ink'),
        lineColor: v('--muted'),
        edgeLabelBackground: v('--bg'),
        clusterBkg: v('--grid'),
        clusterBorder: v('--line'),
        actorBkg: v('--surface'),
        actorBorder: v('--line'),
        actorTextColor: v('--ink'),
        signalColor: v('--muted'),
        signalTextColor: v('--ink'),
        noteBkgColor: v('--grid'),
        noteTextColor: v('--ink'),
        stateBkg: v('--surface'),
        stateBorder: v('--line'),
        compositeBackground: v('--grid'),
        compositeBorder: v('--line'),
        altBackground: v('--grid'),
        transitionColor: v('--muted'),
        transitionLabelColor: v('--ink'),
        attributeBackgroundColorOdd: v('--surface'),
        attributeBackgroundColorEven: v('--grid'),
        sectionBkgColor: v('--grid'),
        altSectionBkgColor: v('--surface'),
        taskBkgColor: v('--grid'),
        taskBorderColor: v('--line'),
        taskTextColor: v('--ink'),
        taskTextOutsideColor: v('--muted'),
        taskTextDarkColor: v('--ink'),
        activeTaskBkgColor: v('--grid'),
        activeTaskBorderColor: v('--cat-1'),
        doneTaskBkgColor: v('--surface'),
        doneTaskBorderColor: v('--line'),
        critBkgColor: v('--red-fill'),
        critBorderColor: v('--red'),
        todayLineColor: v('--amber'),
        gridColor: v('--line'),
        git0: v('--cat-1'), git1: v('--cat-2'), git2: v('--cat-3'), git3: v('--cat-4'),
        git4: v('--grid'), git5: v('--grid'), git6: v('--grid'), git7: v('--grid'),
        fillType0: v('--red-fill'),
        fillType1: v('--amber-fill'),
        fillType2: v('--green-fill'),
        fillType3: v('--blue-fill'),
        fontSize: '13px'
      }
    });
</script>
```

The bootstrap is part of rendering Mermaid, not an extra script. Place it after the token block in `<head>` so the properties resolve, and read the scheme once at load — a reader who toggles the OS scheme afterwards reloads the page.

Do not color nodes to distinguish roles or tracks. The `themeVariables` palette already separates a diagram from the page, and role color is decoration: a reader cannot tell whether green means "core" or "confirmed". Use `classDef` or `linkStyle` only when the color **is** the finding — a leakage edge, a cycle, a module the report independently marks as unconfirmed — and reference the tokens rather than literal hex:

```html
<pre class="mermaid">
flowchart LR
  HTTP[HTTP adapter] --> Order[Order intake]
  Order --> Pricing[Pricing]
  Pricing -.->|leak| Order
  linkStyle 2 stroke:var(--red),color:var(--red)
</pre>
```

Every color used this way must state a claim that also appears in the relationship evidence table. If a pinned Mermaid version drops `var()`, fall back to the literal `-stroke` and `-fill` hex values from the token block for that diagram.

Rules:

- Use a `flowchart` for architecture or branching, and a `sequenceDiagram` for a lifecycle of key functions. Reach for Mermaid whenever freeform connectors, `alt`/`opt`/`loop` fragments, state transitions, or lifelines would otherwise cross; keep a CSS pattern where it reads more clearly.
- Sequence diagrams combine with [domain-concepts.md](DOMAIN-CONCEPTS.md): participants and message labels use `CONFIRMED` domain terms, and messages name the concrete function plus its lifecycle phase (`register`, `validate`, `execute`, `emit`, `commit`, `cleanup`). Do not promote an identifier to a participant just to fill the diagram.
- Pin the runtime version. Load only Mermaid from a CDN; keep web fonts and Tailwind out.
- The bootstrap above already sets each type's own keys (`sectionBkgColor`, `fillType0`, `git0`, `attributeBackgroundColorOdd`, `stateBkg`, …). Mermaid's defaults for those are off-palette pastels, so keep them wired to the tokens and never restyle a type per diagram.
- Escape every dynamic label inside the Mermaid source: quote labels and encode the active quote, `#`, `;`, `{`, `}`, `<`, `&`. Do not embed HTML inside Mermaid, and keep links in the evidence table or a caption below the diagram.
- Never use Mermaid `click`/URL callbacks, and never raise `securityLevel` above `strict`. They bypass the context-escaping rule and let repository content execute.
- Wrap the diagram in a horizontal overflow container. The runtime SVG is generated in the browser, so the 1,000-line budget applies to the source you write, not the rendered output.
- One diagram carries one finding. Split it when a reader cannot follow it in a single pass, and keep the relationship evidence table authoritative for precision.

### Inline SVG exception

Prefer Mermaid (above) for freeform connectors. Hand-write inline SVG only when topology itself is the finding and Mermaid cannot express it. Before writing it:

1. Place nodes on explicit rows and columns.
2. Give every node a fixed width and height.
3. Route edges on lanes outside node rectangles.
4. Draw edges before nodes so boxes cover line ends.
5. Use short labels in the SVG and full details below.
6. Use `viewBox` and `width="100%"`; never depend on viewport coordinates.
7. Limit the overview to seven nodes. Split a larger graph into focused diagrams.

If two edges would cross or a label would overlap, use the fixed-track architecture plus relationship table instead.

### Color constraints by diagram type

Every diagram starts neutral and may add only the accent range named in the table below. This is a closed selection range: use the provided tokens in the prescribed order and quantity instead of inventing a hue or choosing a literal color per node.

- **Neutral base** — `--line`, `--muted`, `--surface`, `--grid`. Use for all structure with no claim attached.
- **Category range** — `--cat-1` … `--cat-4` and their `-fill` pairs. Names a zone: which track, band, block, or top-level branch. Start at slot 1, add slots in order, stop at four, and keep one slot consistent within one zone. The slots are nominal, not ranked.
- **Evidence range** — `--blue`, `--green`, `--amber`, `--red` and their `-fill` pairs. Blue means runtime observation, green confirmed, amber unresolved or caution, and red contradicted, failed, leaking, or critical. Select by meaning, never by visual variety.
- **Combination rule** — neutral may accompany either range. Category and evidence accents do not appear in the same diagram. If evidence must be shown inside a category diagram, write a status label in neutral styling and move the colored verdict to the evidence section.
- **Red budget** — use one red emphasis group per diagram. If several contradictions appear together, keep visible text on every row and reserve filled red treatment for the highest-priority group.

| Diagram | Palette | Constraint |
|---|---|---|
| Architecture — fixed tracks | category | one slot per track through `track-1`…`track-4`; identical inside a track; maximum four |
| Flow — ordered rail | category | one slot for the whole rail (`--cat-1`); never per step |
| Sequence — participant lifelines | neutral | no color at all; the route text carries the relationship |
| Impact — bands | category | one slot per band through `:nth-child`; maximum four |
| Verification — verdict rows | evidence | `contradicted` red, `unresolved` amber, `confirmed` green; nothing else |
| Interface depth — mass diagram | category + neutral | interface bar `--cat-1`, implementation body neutral; never two different interface colors |
| Inline SVG | neutral + one accent | nodes `--surface`/`--line`, edges `--muted`; a single `--red` edge only when that edge is the finding |
| Mermaid `flowchart` | neutral + one accent | no node color; at most one `linkStyle` in `--red` |
| Mermaid `sequenceDiagram` | neutral | no `classDef`; actors, signals, and notes come from the bootstrap |
| Mermaid `stateDiagram-v2` | neutral | no `classDef`; composite and alternative states come from the bootstrap |
| Mermaid `classDiagram` | neutral | no `classDef` |
| Mermaid `erDiagram` | neutral | no `classDef`; attribute rows alternate `--surface`/`--grid` |
| Mermaid `block` | category | one slot per block, maximum four |
| Mermaid `timeline` | neutral | no color; the order is the information |
| Mermaid `mindmap` | category | one slot per top-level branch through `git0`…`git3`; deeper levels stay `--grid` |
| Mermaid `journey` | evidence | ordinal only — `fillType0` red, `fillType1` amber, `fillType2` green, `fillType3` blue — because a score is a judgment rather than a zone |
| Mermaid `gantt` | neutral + two accents | bars `--grid`/`--line`; `critBkgColor` `--red` and `todayLineColor` `--amber` only; no other hue |

Two rules keep this honest:

- If a color is not in this table, do not add it.
- If a color would tell the reader something they can already read from a label or a position, drop the color.

## Report structure

Include only sections useful to the selected mode, in this order:

1. **Header** — repository, scope, revision, current stage, selected modes, active lens, controls, generated time, and worktree status.
2. **Direct answer** — one compact statement that answers the reading question.
3. **Workflow and coverage** — stage/mode/lens position; `READ`, `PARTIAL`, `UNREAD`, `SKIPPED`, and `STALE` totals at the map's current granularity; next frontier; link to `investigation-map.md`.
4. **Primary visual** — architecture tracks or a Mermaid `flowchart` for `ORIENT`; ordered rail or a sequence/lifecycle diagram (CSS lifelines or Mermaid `sequenceDiagram`) for `TRACE`; impact bands for `IMPACT`; verdict rows for `VERIFY`. Diagrams may be CSS-rendered or client-rendered Mermaid.
5. **Relationship evidence** — source module, relationship, target module, linked paths/symbols, evidence status.
6. **Module details** — responsibility, interface, hidden implementation, seam, adapters, dependencies, and linked source symbols.
7. **Domain concepts summary** — only terms required for the answer plus a link to `domain-concepts.md`; keep full definitions in that document.
8. **Reading path or checks** — dependency-ordered paths for `ORIENT`; relevant checks for focused modes.
9. **Unknowns and frontier** — unresolved facts, deliberately unread scope, and the next highest-value slice.

The visual carries structure; the evidence table carries precision; the map carries coverage; the domain document carries terminology. Do not duplicate full prose across them.

## Minimal scaffold

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Codebase Lens: REPOSITORY</title>
  <style>
    :root {
      color-scheme: light dark;
      --bg: #f3f5f8;
      --surface: #ffffff;
      --line: #d6dee8;
      --grid: #e9eef4;
      --ink: #202b38;
      --muted: #647386;
      --blue: #2589bd;  --blue-fill: rgba(37, 137, 189, .09);
      --green: #43846b; --green-fill: rgba(67, 132, 107, .09);
      --amber: #b97819; --amber-fill: rgba(185, 120, 25, .10);
      --red: #a85b54;   --red-fill: rgba(168, 91, 84, .07);
      --cat-1: #3b9cc5; --cat-1-fill: rgba(59, 156, 197, .10);
      --cat-2: #7b6dbc; --cat-2-fill: rgba(123, 109, 188, .10);
      --cat-3: #d0912f; --cat-3-fill: rgba(208, 145, 47, .10);
      --cat-4: #35998d; --cat-4-fill: rgba(53, 153, 141, .10);
      --radius: 8px;
      --radius-sm: 5px;
      --mono: ui-monospace, SFMono-Regular, Menlo, Consolas, "DejaVu Sans Mono", monospace;
      --t: 160ms;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #0f1724;
        --surface: #172235;
        --line: #33445c;
        --grid: #202d43;
        --ink: #edf4fb;
        --muted: #a7b6c8;
        --blue: #67c2eb;  --blue-fill: rgba(103, 194, 235, .12);
        --green: #7bc3a3; --green-fill: rgba(123, 195, 163, .11);
        --amber: #f0bd5d; --amber-fill: rgba(240, 189, 93, .12);
        --red: #d68b84;   --red-fill: rgba(214, 139, 132, .08);
        --cat-1: #69c3e3; --cat-1-fill: rgba(105, 195, 227, .12);
        --cat-2: #aa99e2; --cat-2-fill: rgba(170, 153, 226, .12);
        --cat-3: #e6ad52; --cat-3-fill: rgba(230, 173, 82, .12);
        --cat-4: #63c3b5; --cat-4-fill: rgba(99, 195, 181, .12);
      }
    }
    * { box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    body { margin: 0; background: var(--bg); color: var(--ink); font: 15px/1.6 system-ui, sans-serif; letter-spacing: 0; }
    a { color: var(--blue); text-decoration-thickness: 1px; text-underline-offset: 2px; transition: color var(--t); }
    a:hover { color: var(--ink); }
    main { width: min(1180px, 100%); margin: 0 auto; padding: 32px 24px 64px; }
    header, section { border-bottom: 1px solid var(--line); padding: 0 0 28px; margin: 0 0 28px; }
    h1 { font-size: 28px; margin: 0 0 8px; }
    h2 { font-size: 19px; margin: 0 0 16px; }
    h3 { font-size: 11px; margin: 0 0 10px; color: var(--muted); text-transform: uppercase; letter-spacing: .1em; font-weight: 700; }
    p { max-width: 78ch; }
    code { font: 13px/1.45 var(--mono); overflow-wrap: anywhere; background: var(--grid); border: 1px solid var(--line); border-radius: var(--radius-sm); padding: 1px 5px; }
    a code { background: none; border: 0; padding: 0; }
    .meta, .legend { display: flex; flex-wrap: wrap; gap: 8px 18px; color: var(--muted); }
    .architecture { display: grid; align-items: stretch; }
    .architecture.tracks-3 { grid-template-columns: minmax(0,1fr) 32px minmax(0,1.4fr) 32px minmax(0,1fr); }
    .architecture.tracks-4 { grid-template-columns: minmax(0,1fr) 32px minmax(0,1.2fr) 32px minmax(0,1.2fr) 32px minmax(0,1fr); }
    .track { min-width: 0; border-left: 3px solid var(--cat, var(--line)); padding: 12px; background: var(--surface); }
    .track > h3 { color: var(--cat, var(--muted)); }
    .track-1 { --cat: var(--cat-1); --cat-fill: var(--cat-1-fill); }
    .track-2 { --cat: var(--cat-2); --cat-fill: var(--cat-2-fill); }
    .track-3 { --cat: var(--cat-3); --cat-fill: var(--cat-3-fill); }
    .track-4 { --cat: var(--cat-4); --cat-fill: var(--cat-4-fill); }
    .track-arrow { display: grid; place-items: center; color: var(--muted); font-size: 22px; }
    .module { border: 1px solid var(--line); border-left: 4px solid var(--cat, var(--line)); border-radius: var(--radius); padding: 10px; margin: 8px 0; background: var(--cat-fill, transparent); }
    .module > strong, .module > span { display: block; overflow-wrap: anywhere; }
    .module > span { color: var(--muted); font-size: 13px; margin-top: 3px; }
    .flow { list-style: none; margin: 0; padding: 0; --cat: var(--cat-1); }
    .flow-step { display: grid; grid-template-columns: 36px minmax(0,1fr); gap: 12px; position: relative; padding-bottom: 18px; }
    .flow-step:not(:last-child)::after { content: ""; position: absolute; left: 17px; top: 34px; bottom: 0; border-left: 2px solid var(--line); }
    .step-number { width: 36px; height: 36px; display: grid; place-items: center; border: 2px solid var(--cat, var(--line)); border-radius: 50%; background: var(--surface); font-weight: 700; }
    .flow-step > div { min-width: 0; border-bottom: 1px solid var(--line); padding: 6px 0 16px; }
    .flow-step > div > strong { display: block; }
    .flow-step > div > a { display: block; }
    .flow-step code { display: inline-block; }
    .branches { margin: 10px 0 0; padding: 2px 0 2px 12px; border-left: 2px solid var(--line); }
    .branches p { margin: 0; color: var(--muted); font-size: 13px; }
    .branches strong { color: var(--ink); }
    .impact-grid { display: grid; grid-template-columns: repeat(4,minmax(0,1fr)); gap: 12px; }
    .impact-band { min-width: 0; background: var(--surface); border: 1px solid var(--line); border-left: 3px solid var(--cat, var(--line)); border-radius: var(--radius); padding: 12px; }
    .impact-band > h3 { color: var(--cat, var(--muted)); }
    .impact-grid > :nth-child(1) { --cat: var(--cat-1); }
    .impact-grid > :nth-child(2) { --cat: var(--cat-2); }
    .impact-grid > :nth-child(3) { --cat: var(--cat-3); }
    .impact-grid > :nth-child(4) { --cat: var(--cat-4); }
    .sequence { overflow-x: auto; }
    .seq-participants { display: grid; grid-template-columns: repeat(auto-fit,minmax(120px,1fr)); gap: 8px; margin-bottom: 10px; }
    .seq-participant { border-bottom: 3px solid var(--muted); font-weight: 700; padding: 6px 4px; }
    .seq-message { display: grid; grid-template-columns: 32px minmax(0,1fr) minmax(0,1.4fr); gap: 10px; align-items: baseline; padding: 9px 0; border-bottom: 1px solid var(--line); }
    .seq-num { width: 26px; height: 26px; display: grid; place-items: center; border: 2px solid var(--line); border-radius: 50%; font-size: 12px; font-weight: 700; align-self: center; }
    .seq-route { overflow-wrap: anywhere; }
    .seq-arrow { color: var(--muted); }
    .seq-label { color: var(--muted); font-size: 13px; overflow-wrap: anywhere; }
    .mass { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px; align-items: end; }
    .mass figure { margin: 0; min-width: 0; }
    .mass figcaption { font-size: 13px; color: var(--muted); margin-top: 6px; }
    .mass .iface, .mass .impl { display: grid; place-items: center; font-size: 12px; border: 1px solid var(--line); overflow-wrap: anywhere; }
    .mass .iface { border-left: 4px solid var(--cat-1); border-bottom: 0; border-radius: var(--radius-sm) var(--radius-sm) 0 0; background: var(--cat-1-fill); }
    .mass .impl { border-left: 4px solid var(--line); border-radius: 0 0 var(--radius-sm) var(--radius-sm); background: var(--surface); color: var(--muted); }
    .mass .h-sm { height: 26px; }
    .mass .h-md { height: 52px; }
    .mass .h-lg { height: 92px; }
    .mass .h-xl { height: 132px; }
    .table-wrap { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; background: var(--surface); }
    th, td { padding: 10px; border: 1px solid var(--line); text-align: left; vertical-align: top; overflow-wrap: anywhere; }
    th { background: var(--grid); font-size: 12px; letter-spacing: .04em; }
    .source { border-left-color: var(--line); }
    .runtime { border-left-color: var(--blue); background: var(--blue-fill); }
    .confirmed { border-left-color: var(--green); background: var(--green-fill); }
    .inferred, .unknown, .validate, .unresolved { border-left-color: var(--amber); background: var(--amber-fill); }
    .contradicted { border-left-color: var(--red); background: var(--red-fill); }
    .status { display: inline-block; border: 1px solid var(--line); border-radius: var(--radius-sm); background: var(--grid); padding: 1px 7px; font-size: 11px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }
    .badge-strong, .badge-explore, .badge-speculative { border-color: currentColor; }
    .badge-strong { color: var(--green); background: var(--green-fill); }
    .badge-explore { color: var(--amber); background: var(--amber-fill); }
    .badge-speculative { color: var(--muted); background: var(--grid); }
    a:focus-visible, summary:focus-visible { outline: 2px solid var(--blue); outline-offset: 2px; }
    summary { cursor: pointer; }
    @media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } * { transition: none; } }
    @media (max-width: 760px) {
      main { padding: 20px 14px 48px; }
      .architecture.tracks-3, .architecture.tracks-4 { grid-template-columns: 1fr; gap: 8px; }
      .track-arrow { transform: rotate(90deg); height: 24px; }
      .impact-grid { grid-template-columns: 1fr; }
      .seq-message { grid-template-columns: 28px minmax(0,1fr); }
      .seq-label { grid-column: 2; }
    }
  </style>
</head>
<body>
  <main>
    <header>...</header>
    <section id="answer">...</section>
    <section id="workflow-coverage">...</section>
    <section id="primary-visual">...</section>
    <section id="evidence">...</section>
    <section id="domain-summary">...</section>
    <section id="unknowns-frontier">...</section>
  </main>
</body>
</html>
```

Extend the CSS only for information required by the report. Keep cards at 8px radius or less. Avoid nested cards, oversized headings, marketing composition, and decorative graphics.

## Validation

Before opening the report:

- confirm `investigation-map.md`, `domain-concepts.md`, and `report.html` exist and are non-empty for a file-producing investigation;
- confirm each generated file is below 1,000 physical lines;
- confirm the map and domain document link to each other, and the report links to both with relative paths;
- check that `<!doctype html>`, `<meta charset>`, viewport metadata, `<title>`, and closing `</html>` exist;
- confirm the header and coverage section agree with the map's current stage, mode, lens, revision, and coverage totals;
- confirm a three-track architecture has three sections and two arrows with `tracks-3`, or a four-track architecture has four sections and three arrows with `tracks-4`;
- scan for unescaped dynamic values and accidental Markdown fences;
- when Mermaid is used, confirm the runtime version is pinned, `mermaid.initialize` is configured from the token block with `theme: 'base'` and `securityLevel: 'strict'`, the source sits in `<pre class="mermaid">` blocks with no Markdown fences, no node carries a role or track color, every intentional `classDef`/`linkStyle` color states a claim that also appears in the evidence table, and no `click`/URL callback carries dynamic values;
- when `IMPACT` is selected, confirm every impact item carries a recommendation-strength badge that is distinct from its relationship class and its evidence status, and that each badge color is paired with visible text;
- confirm every sequence-diagram participant and message label uses domain terms from `domain-concepts.md`, and that its material relationships also appear in the evidence table;
- confirm every named source symbol is a link with a visible path and line range, and sample links against the recorded revision;
- confirm every material relationship in the primary visual appears in the evidence table;
- confirm evidence, coverage, and verdict colors also have text labels;
- confirm the full glossary is not duplicated in the report and no section is empty merely because it is in the scaffold.

When browser automation is available, inspect one desktop and one narrow viewport for overflow and overlap. Otherwise open the file normally and state that automated visual verification was unavailable only when that limitation matters.

## Completion

A file-producing investigation is complete for the current stop point when all three artifacts satisfy their contracts, the report opens successfully or has a reported open failure, the map contains an honest resumable frontier or terminal state, and every absolute artifact path is returned. Response-only output is complete when no files were created and the concise chat findings include the current stage, mode, lens, coverage, domain terms, direct answer, and next frontier.
