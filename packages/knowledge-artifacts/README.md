# knowledge-artifacts

A skill for documents that have to outlive the conversation that produced them. Plans, specs, repo analyses, data analyses, and reports earn a file only when the knowledge **does not fit in context and a fresh session must be able to open it, revise it, and resume or re-run it**. The skill gates that decision, splits the document into frozen prose and marked **seams**, and ships a domain-agnostic tool for reading and patching those seams.

## Install

Install the npm package in Pi:

```bash
pi install npm:knowledge-artifacts
```

Or install every skill in this repository from GitHub:

```bash
pi install git:github.com/fookhsu/skills
```

Add `-l` to either command to install for the current project instead of your user account.

## Use

Describe the work product in ordinary language. The skill runs a six-question gate first: it may answer that the right output is a chat reply, not an artifact. When an artifact is warranted, it chooses the shell (HTML or Markdown), cuts the seams, and writes the checkpoint.

| Agent | Invocation |
|---|---|
| Pi | `/skill:knowledge-artifacts your request` |
| Claude Code | `/knowledge-artifacts your request` |
| Codex CLI and compatible agents | `$knowledge-artifacts your request`, or ask naturally |

<details>
<summary><strong>Usage examples</strong></summary>

### A plan that will be re-litigated

```text
/skill:knowledge-artifacts Turn this into a plan I can review visually, and cut the rules I will keep tuning into their own seam.
```

### A repo analysis that must not silently rot

```text
/skill:knowledge-artifacts Analyze the module structure of packages/core. Keep the findings as a separate layer so re-running does not clobber my judgments.
```

### A data analysis with hand-fixed outliers

```text
/skill:knowledge-artifacts Analyze data/churn.csv and record which outliers I chose to exclude as decisions that survive a re-run.
```

### Revise an existing artifact

```text
/skill:knowledge-artifacts Read the checkpoint in docs/plan.html and tell me what is next.
```

### Re-run after the input moved

```text
/skill:knowledge-artifacts The report says it is stale. Re-run the procedure and refresh only the regenerable seam.
```

</details>

## What the skill guarantees

Three properties make an artifact revisable by an agent that never saw the original conversation:

- **Seams** — marked regions holding the values that change. Everything outside is frozen.
- **A contract per seam** — field list, kinds, allowed values. The rendered table, the validator, and any editor all project from it; nothing restates it.
- **A checkpoint (META) and provenance (PROVENANCE)** — so a new session can orient, and a derived artifact can say whether it is still true.

The domain-specific part is thin and pluggable: it lives in [adapters](skills/knowledge-artifacts/ADAPTERS.md). The core and the tool are domain-agnostic.

An artifact looks like this:

```html
<!-- META -->
{ "title": "…", "status": "in-progress", "next": "…", "done-when": "…" }
<!-- /META -->

<!-- SEAM:rules -->
<script type="application/json" id="rules-schema">{ "fields": { … } }</script>
<script type="application/json" id="rules-data">[ … ]</script>
<!-- /SEAM:rules -->

<!-- PROVENANCE -->
{ "generated-from": "data/churn.csv", "generated-at": "2026-09-13T10:00:00Z",
  "procedure": "python analyze.py data/churn.csv" }
<!-- /PROVENANCE -->
```

## Patch protocol

The patch tool reads both HTML and Markdown shells, so the same commands work on either.

```bash
S=<skill-dir>/scripts/patch-region.ts

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

A contract change is enumerated rather than regenerated: `drift` reports added, removed, narrowed, and retyped fields against the current data, and `apply-schema` refuses to land ahead of its data. The frozen shell needs zero edits — it was a projection, so it re-renders.

## Adapters

| Adapter | Derived/authored | What changes | Annotation layer | Shell |
|---|---|---|---|---|
| [`html-plan`](skills/knowledge-artifacts/adapters/html-plan/adapter.md) | authored | decision values in a plan (rules/config/enums) | — | HTML (visual review) |
| [`repo-analysis`](skills/knowledge-artifacts/adapters/repo-analysis/adapter.md) | derived | module catalog + findings | `findings` (judgments, keyed by module hash) | HTML or MD |
| [`data-analysis`](skills/knowledge-artifacts/adapters/data-analysis/adapter.md) | derived | metric results + decisions | `decisions` (exclude/keep/recheck) | HTML or MD |

Adding a domain is adding a directory under `skills/knowledge-artifacts/adapters/`. The core and the tool stay untouched. See [ADAPTERS.md](skills/knowledge-artifacts/ADAPTERS.md).

## Source safety

The skill writes artifacts; it does not edit project source. Only the seam values change, and only through the patch tool, so a revision never rewrites the frozen layer.

<details>
<summary><strong>Install on other Agent Skills-compatible tools</strong></summary>

Copy the skill directory into the location used by your agent:

```bash
# Claude Code
cp -r packages/knowledge-artifacts/skills/knowledge-artifacts ~/.claude/skills/

# Codex CLI and other tools that use ~/.agents/skills
cp -r packages/knowledge-artifacts/skills/knowledge-artifacts ~/.agents/skills/
```

From this repository, the helper can install or symlink it:

```bash
node scripts/install-skill.mjs knowledge-artifacts --agent claude
node scripts/install-skill.mjs knowledge-artifacts --agent agents --scope project --link
```

</details>

<details>
<summary><strong>Package contents</strong></summary>

```text
skills/knowledge-artifacts/     # agent-facing skill root
├── SKILL.md                    # the gate, the generation contract, the patch protocol
├── ADAPTERS.md                 # how to add a domain adapter
├── MICRO-APP.md                # when and how to cut a disposable seam editor loose
├── agents/
│   └── openai.yaml
├── adapters/
│   ├── html-plan/
│   ├── repo-analysis/
│   └── data-analysis/
└── scripts/
    └── patch-region.ts         # domain-agnostic seam reader/patcher
```

</details>

## License

MIT
