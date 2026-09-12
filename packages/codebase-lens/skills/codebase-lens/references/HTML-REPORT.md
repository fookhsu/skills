# HTML report

Render a completed investigation as a self-contained HTML file unless the user chose response-only output. HTML is the primary artifact when a file is produced; chat receives the direct answer, important unknowns, and its absolute path.

## Output decision

Choose exactly one branch:

| Request | File behavior | Open behavior |
|---|---|---|
| Default | Securely create one fresh file in the OS temp directory | Attempt to open it |
| Response-only | Write no report file | Open nothing; return the concise findings in chat |
| Approved durable path | Write only to that exact path | Attempt to open it unless the user says not to |

A durable report is a project-file edit: show the path and obtain approval before writing it. Do not also create a temp copy unless the user requests both.

For the default branch, use the operating system or standard-library temporary-file facility with exclusive creation and a random suffix. A descriptive prefix is useful, but it is not the uniqueness mechanism:

```text
<tmpdir>/codebase-lens-<repo>-<mode>-<timestamp>-<random>.html
```

Sanitize `<repo>` and `<mode>` to lowercase ASCII letters, numbers, and hyphens. A suitable implementation uses Node `fs.open(..., "wx")`, Python `tempfile`, or an equivalent OS-backed primitive; retry collisions instead of overwriting.

Open the result by passing the absolute path as one argument to the operating system launcher: `open` on macOS, `xdg-open` on Linux, or `start`/`Start-Process` on Windows. Use an argument array such as Node `spawn(command, [path])` or Python `subprocess.run([command, path])`; never build a shell command by concatenating the path. If opening fails, keep the report and state the failure with its absolute path.

## Rendering contract

- Produce valid standalone HTML5 with UTF-8, viewport metadata, inline CSS, and no build step.
- Use semantic HTML, CSS Grid/Flexbox, and inline SVG only when a freeform connector is necessary.
- Do not use Markdown diagrams, Mermaid, Tailwind, web fonts, or CDN assets. The file must work offline.
- Context-escape every non-template value before inserting it into HTML, including user input, repository content, paths, command output, labels, and generated prose. Escape text nodes and quoted attributes separately; at minimum text must encode `&`, `<`, and `>`, while attributes must also encode the active quote character. Never interpolate dynamic raw HTML or place dynamic values in `<style>`, `<script>`, URL-valued attributes, or event-handler attributes.
- Include no executable JavaScript unless the user explicitly requests interaction. Prefer `<details>` for disclosure.
- Keep the report readable at 360px and at desktop widths. Tables use horizontal overflow containers; long paths wrap with `overflow-wrap:anywhere`.
- Use color as a secondary signal. Every status also has visible text.
- Use a restrained neutral palette with separate green, blue, amber, and red status accents. Avoid gradients and decorative effects.

## Stable diagram patterns

The report must choose a pattern that fits the relationship. Do not force a freeform graph onto every question.

### Architecture: fixed tracks

Use a three- or four-track CSS grid such as **Entry**, **Core behavior**, **State**, and **External effects**. Put each module in exactly one track. Show the dominant direction from left to right on desktop and top to bottom on narrow screens. Select the matching `tracks-3` or `tracks-4` class; the number of track sections and arrow elements must match it.

```html
<div class="architecture tracks-3" aria-label="Architecture map">
  <section class="track">
    <h3>Entry</h3>
    <div class="module source"><strong>HTTP adapter</strong><span>registers routes</span></div>
  </section>
  <div class="track-arrow" aria-hidden="true">&#8594;</div>
  <section class="track">
    <h3>Core behavior</h3>
    <div class="module runtime"><strong>Order intake</strong><span>validate &#183; price &#183; commit</span></div>
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
    <div><strong>Route registration</strong><code>src/http.ts:register</code></div>
  </li>
  <li class="flow-step inferred">...</li>
</ol>
```

Put branches directly under the node that selects them, using a nested `.branches` block. Keep the main rail linear; do not draw return arrows across the page.

### Impact: radial lists without radial geometry

Use four adjacent bands labelled `DIRECT`, `INDIRECT`, `VALIDATE`, and `NO EVIDENCE`. Each item states the concrete relationship and its independent evidence status. This preserves both dimensions without a fragile graph.

### Verification: verdict rows

Use one row per claim with `CONFIRMED`, `CONTRADICTED`, or `UNRESOLVED`, followed by the independent evidence. Put contradictions first.

### Interface depth: mass diagram

When depth is material, use paired rectangles: a short interface band over an implementation body. Compare modules side by side only when dimensions mean the same thing. Label the caller knowledge represented by the interface; do not imply a line-count metric.

### Inline SVG exception

Use inline SVG only when topology itself is the finding. Before writing it:

1. Place nodes on explicit rows and columns.
2. Give every node a fixed width and height.
3. Route edges on lanes outside node rectangles.
4. Draw edges before nodes so boxes cover line ends.
5. Use short labels in the SVG and full details below.
6. Use `viewBox` and `width="100%"`; never depend on viewport coordinates.
7. Limit the overview to seven nodes. Split a larger graph into focused diagrams.

If two edges would cross or a label would overlap, use the fixed-track architecture plus relationship table instead.

## Report structure

Include only sections useful to the selected mode, in this order:

1. **Header** — repository, scope, revision, mode, generated time, worktree status.
2. **Direct answer** — one compact statement that answers the reading question.
3. **Primary visual** — architecture tracks for `ORIENT`, ordered rail for `TRACE`, impact bands for `IMPACT`, verdict rows for `VERIFY`.
4. **Relationship evidence** — source module, relationship, target module, paths/symbols, evidence status.
5. **Module details** — responsibility, interface, hidden implementation, seam, adapters, dependencies.
6. **Vocabulary** — canonical term, aliases, meaning and limits, status, evidence.
7. **Reading path or checks** — dependency-ordered paths for `ORIENT`; relevant checks for focused modes.
8. **Unknowns** — unresolved facts and the next highest-value check.

The visual carries structure; the evidence table carries precision. Do not duplicate full prose across both.

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
      color-scheme: light;
      --bg: #f7f8fa;
      --surface: #ffffff;
      --ink: #17202a;
      --muted: #5f6b76;
      --line: #d7dde3;
      --blue: #2368a2;
      --green: #247a52;
      --amber: #9a6700;
      --red: #b42318;
      --radius: 6px;
    }
    * { box-sizing: border-box; }
    body { margin: 0; background: var(--bg); color: var(--ink); font: 15px/1.5 system-ui, sans-serif; letter-spacing: 0; }
    main { width: min(1180px, 100%); margin: 0 auto; padding: 32px 24px 64px; }
    header, section { border-bottom: 1px solid var(--line); padding: 0 0 28px; margin: 0 0 28px; }
    h1 { font-size: 28px; margin: 0 0 8px; }
    h2 { font-size: 19px; margin: 0 0 16px; }
    h3 { font-size: 13px; margin: 0 0 10px; color: var(--muted); text-transform: uppercase; }
    p { max-width: 78ch; }
    code { font: 13px/1.4 ui-monospace, monospace; overflow-wrap: anywhere; }
    .meta, .legend { display: flex; flex-wrap: wrap; gap: 8px 18px; color: var(--muted); }
    .architecture { display: grid; align-items: stretch; }
    .architecture.tracks-3 { grid-template-columns: minmax(0,1fr) 32px minmax(0,1.4fr) 32px minmax(0,1fr); }
    .architecture.tracks-4 { grid-template-columns: minmax(0,1fr) 32px minmax(0,1.2fr) 32px minmax(0,1.2fr) 32px minmax(0,1fr); }
    .track { min-width: 0; border-left: 3px solid var(--line); padding: 12px; background: var(--surface); }
    .track-arrow { display: grid; place-items: center; color: var(--muted); font-size: 22px; }
    .module { border: 1px solid var(--line); border-left: 4px solid var(--blue); border-radius: var(--radius); padding: 10px; margin: 8px 0; }
    .module strong, .module span { display: block; overflow-wrap: anywhere; }
    .module span { color: var(--muted); font-size: 13px; margin-top: 3px; }
    .flow { list-style: none; margin: 0; padding: 0; }
    .flow-step { display: grid; grid-template-columns: 36px minmax(0,1fr); gap: 12px; position: relative; padding-bottom: 18px; }
    .flow-step:not(:last-child)::after { content: ""; position: absolute; left: 17px; top: 34px; bottom: 0; border-left: 2px solid var(--line); }
    .step-number { width: 36px; height: 36px; display: grid; place-items: center; border: 2px solid var(--blue); border-radius: 50%; background: var(--surface); font-weight: 700; }
    .flow-step > div { min-width: 0; border-bottom: 1px solid var(--line); padding: 6px 0 16px; }
    .flow-step strong, .flow-step code { display: block; }
    .impact-grid { display: grid; grid-template-columns: repeat(4,minmax(0,1fr)); gap: 12px; }
    .impact-band { min-width: 0; background: var(--surface); border: 1px solid var(--line); border-radius: var(--radius); padding: 12px; }
    .table-wrap { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; background: var(--surface); }
    th, td { padding: 10px; border: 1px solid var(--line); text-align: left; vertical-align: top; overflow-wrap: anywhere; }
    th { background: #edf1f4; font-size: 13px; }
    .source { border-left-color: var(--blue); }
    .runtime, .confirmed { border-left-color: var(--green); }
    .inferred, .validate, .unresolved { border-left-color: var(--amber); }
    .contradicted { border-left-color: var(--red); }
    .status { font-weight: 700; }
    @media (max-width: 760px) {
      main { padding: 20px 14px 48px; }
      .architecture.tracks-3, .architecture.tracks-4 { grid-template-columns: 1fr; gap: 8px; }
      .track-arrow { transform: rotate(90deg); height: 24px; }
      .impact-grid { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <main>
    <header>...</header>
    <section id="answer">...</section>
    <section id="primary-visual">...</section>
    <section id="evidence">...</section>
    <section id="unknowns">...</section>
  </main>
</body>
</html>
```

Extend the CSS only for information required by the report. Keep cards at 8px radius or less. Avoid nested cards, oversized headings, marketing composition, and decorative graphics.

## Validation

Before opening the report:

- confirm the file exists, is non-empty, and was created exclusively rather than overwriting another report;
- check that `<!doctype html>`, `<meta charset>`, viewport metadata, `<title>`, and closing `</html>` exist;
- confirm a three-track architecture has three sections and two arrows with `tracks-3`, or a four-track architecture has four sections and three arrows with `tracks-4`;
- scan for unescaped dynamic values and accidental Markdown fences;
- confirm every material relationship in the primary visual appears in the evidence table;
- confirm evidence and verdict colors also have text labels;
- confirm no section is empty merely because it is in the scaffold.

When browser automation is available, inspect one desktop and one narrow viewport for overflow and overlap. Otherwise open the file normally and state that automated visual verification was unavailable only when that limitation matters.

## Completion

A file report is complete when it opens successfully or has a reported open failure, answers the selected question, contains a stable mode-appropriate visual, preserves evidence statuses in text, works without network access, and its absolute path is returned to the user. Response-only output is complete when no file was created and the concise chat findings answer the selected question.
