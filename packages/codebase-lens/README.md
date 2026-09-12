# codebase-lens

An evidence-backed skill for understanding unfamiliar codebases. It follows behavior through modules, keeps read and unread scope visible, verifies important conclusions, and produces a linked HTML report. Project source stays unchanged unless you explicitly approve a bounded demo.

## Install

Install the npm package in Pi:

```bash
pi install npm:codebase-lens
```

Or install every skill in this repository from GitHub:

```bash
pi install git:github.com/fookhsu/skills
```

Add `-l` to either command to install for the current project instead of your user account.

## Use

Ask for what you want to understand in ordinary language. Name the behavior, file, symbol, feature, or change when you know it; add a package or directory when you want to limit the scope. The skill infers the investigation method and reading bounds.

| Agent | Invocation |
|---|---|
| Pi | `/skill:codebase-lens your request` |
| Claude Code | `/codebase-lens your request` |
| Codex CLI and compatible agents | `$codebase-lens your request`, or ask naturally |

Continue in the same conversation to refine the question or resume an incomplete investigation.

<details>
<summary><strong>Usage examples</strong></summary>

### Understand a project

```text
/skill:codebase-lens Explain what this project does and give me a dependency-ordered reading path.
```

```text
/skill:codebase-lens Focus on packages/payments. Show how its entry points reach the central behavior and external effects.
```

### Trace behavior

```text
/skill:codebase-lens Trace how POST /orders reaches a committed order, including validation, state changes, errors, and emitted events.
```

```text
/skill:codebase-lens Follow the OrderPlaced background job from registration through retries and side effects.
```

### Analyze impact

```text
/skill:codebase-lens What could break if Run.status gains a new value? Include the checks I should run before changing it.
```

```text
/skill:codebase-lens Review the changes on this branch and map their likely blast radius. Limit the investigation to packages/core and packages/api.
```

### Verify a claim

```text
/skill:codebase-lens Verify whether every production write goes through SearchStore. Look for contradicting evidence, not just confirmation.
```

### Control the output naturally

```text
/skill:codebase-lens Investigate the authorization path, answer in chat only, and do not create files.
```

```text
/skill:codebase-lens Start mapping the server entry points, stop after identifying the landmarks, and do not open a report yet.
```

```text
/skill:codebase-lens Continue the investigation recorded in .codebase-lens/server-map/investigation-map.md and finish the report.
```

```text
/skill:codebase-lens Trace checkout and then propose a small isolated demo if it would resolve an important unknown. Wait for my approval before editing code.
```

</details>

## What you get

A completed investigation answers the question directly in chat and, by default, creates:

```text
docs/codebase-lens/
├── investigation-map.md  # progress, coverage, evidence, and next frontier
├── domain-concepts.md    # project terminology with linked evidence
└── report.html           # human-facing findings and diagrams
```

The report links named source symbols to verified locations. Large repositories are read in bounded slices, so untouched areas remain explicitly unread instead of disappearing from the result. Ask for a chat-only answer when you do not want files.

## HTML report

The report chooses visuals that match the question: architecture tracks, execution flows, impact bands, verdict rows, Mermaid relationship diagrams, or focused inline SVG. It supports coordinated light and dark themes with constrained category and evidence colors.

Open the human-facing [`HTML-REPORT-PREVIEW.html`](HTML-REPORT-PREVIEW.html) to inspect the complete palette and every supported diagram type. The preview sits outside the skill and is not loaded during skill execution.

## Source safety

Investigation starts read-only. The skill may write its investigation artifacts, but it does not edit project source unless it first presents a bounded demo contract and the user explicitly approves the edit.

<details>
<summary><strong>Install on other Agent Skills-compatible tools</strong></summary>

Copy the skill directory into the location used by your agent:

```bash
# Claude Code
cp -r packages/codebase-lens/skills/codebase-lens ~/.claude/skills/

# Codex CLI and other tools that use ~/.agents/skills
cp -r packages/codebase-lens/skills/codebase-lens ~/.agents/skills/
```

From this repository, the helper can install or symlink it:

```bash
node scripts/install-skill.mjs codebase-lens --agent claude
node scripts/install-skill.mjs codebase-lens --agent agents --scope project --link
```

</details>

<details>
<summary><strong>Package contents</strong></summary>

```text
HTML-REPORT-PREVIEW.html       # human-facing visual gallery
skills/codebase-lens/          # agent-facing skill root
├── SKILL.md
├── agents/
│   └── openai.yaml
└── references/
    ├── ARCHITECTURE.md
    ├── CODE-READING.md
    ├── DEMO.md
    ├── DOMAIN-CONCEPTS.md
    ├── HTML-REPORT.md
    └── INVESTIGATION-MAP.md
```

</details>

## License

MIT
