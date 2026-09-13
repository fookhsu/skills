# Pi Skills

A monorepo of [Pi](https://pi.dev/) agent skills, available from GitHub and npm. Packages here extend Pi with reusable, installable capabilities.

Two packages ship today:

- **codebase-lens** — reading unfamiliar codebases with evidence: a resumable investigation map, behavior traced through modules, domain concepts kept separate, change impact, and a self-contained HTML architecture and flow report with linked source symbols and bounded reading budgets.
- **knowledge-artifacts** — documents that outlive the conversation that produced them: a gate that decides whether an artifact is warranted at all, frozen prose around marked seams, a contract per seam, a resume checkpoint and provenance, and a domain-agnostic patch tool.

Each directory under `packages/` is a standalone skill package. Packages share one repository, validation script, and documentation conventions.

## Install

Install every skill in this repository from GitHub:

```bash
pi install git:github.com/fookhsu/skills
```

Or install a single package from npm:

```bash
pi install npm:codebase-lens
pi install npm:knowledge-artifacts
```

Add `-l` to write the install to project settings (`.pi/settings.json`) instead of user settings. To remove an install later:

```bash
pi remove git:github.com/fookhsu/skills
pi remove npm:codebase-lens
pi remove npm:knowledge-artifacts
```

## Use with your agent

Every skill here is a standard `SKILL.md`, so it runs on any agent that implements the [Agent Skills](https://agentskills.io/specification) specification. Only the skills directory differs:

| Agent | Skills directory | Invoke |
|---|---|---|
| Pi | `~/.pi/agent/skills/`, or `pi install` | `/skill:codebase-lens`, `/skill:knowledge-artifacts` |
| Claude Code | `~/.claude/skills/` or `<project>/.claude/skills/` | `/codebase-lens`, `/knowledge-artifacts` |
| Codex CLI | `~/.agents/skills/` or `<project>/.agents/skills/` | `$codebase-lens`, `$knowledge-artifacts`, or just ask |
| Cursor, Gemini CLI, GitHub Copilot, Cline, Windsurf, OpenCode | that agent's skills directory | agent-specific |

Install with one command, or copy the skill directory yourself:

```bash
node scripts/install-skill.mjs codebase-lens                   # Claude Code + Codex + Pi
node scripts/install-skill.mjs knowledge-artifacts             # same, for the artifact skill
node scripts/install-skill.mjs codebase-lens --agent claude
node scripts/install-skill.mjs knowledge-artifacts --scope project
```

```bash
cp -r packages/codebase-lens/skills/codebase-lens ~/.claude/skills/
cp -r packages/knowledge-artifacts/skills/knowledge-artifacts ~/.claude/skills/
```

Describe the task in ordinary language; each skill infers how to proceed. See the [codebase-lens README](./packages/codebase-lens/README.md) for codebase reading and the [knowledge-artifacts README](./packages/knowledge-artifacts/README.md) for artifact generation, seams, and the patch protocol.

<details>
<summary><strong>Usage examples</strong></summary>

```text
/skill:codebase-lens Explain what this project does and where I should start reading.
/skill:codebase-lens Trace how POST /orders reaches a committed order.
/skill:codebase-lens What could break if Run.status gains a new value?
```

```text
/skill:knowledge-artifacts Turn this into a plan I can review visually and cut the rules I will keep tuning into their own seam.
/skill:knowledge-artifacts Analyze data/churn.csv and record the outliers I excluded as decisions that survive a re-run.
/skill:knowledge-artifacts Read the checkpoint in docs/plan.html and tell me what is next.
```

</details>

## Packages

| Package | Description | Install | Invoke |
|---|---|---|---|
| [`codebase-lens`](./packages/codebase-lens) | Resumable, evidence-backed codebase reading with read/unread maps, separate domain concepts, linked source symbols, bounded slices, HTML reports, impact analysis, and opt-in demos. | `pi install npm:codebase-lens` or [GitHub](#install) | `/skill:codebase-lens` |
| [`knowledge-artifacts`](./packages/knowledge-artifacts) | Artifacts that survive revision and session boundaries: a six-question gate, frozen prose around marked seams, a contract per seam, resume checkpoint, provenance, a patch/migrate tool, and pluggable domain adapters. | `pi install npm:knowledge-artifacts` or [GitHub](#install) | `/skill:knowledge-artifacts` |

## Repository structure

```text
skills/
├── packages/
│   ├── codebase-lens/
│   │   ├── package.json
│   │   ├── README.md
│   │   └── skills/
│   │       └── codebase-lens/
│   │           ├── SKILL.md
│   │           └── references/
│   └── knowledge-artifacts/
│       ├── package.json
│       ├── README.md
│       └── skills/
│           └── knowledge-artifacts/
│               ├── SKILL.md
│               ├── ADAPTERS.md
│               ├── MICRO-APP.md
│               ├── adapters/
│               └── scripts/
├── scripts/
│   ├── install-skill.mjs
│   └── validate-packages.mjs
└── package.json
```

## Validate packages

```bash
npm run validate
```

## Add a package

1. Create `packages/<package-name>/`.
2. Add its own `package.json` with the `pi-package` keyword and `pi.skills` manifest.
3. Put the skill at `skills/<package-name>/SKILL.md`.
4. Add a package-specific `README.md`.
5. Add the package to the table above.
6. Run `npm run validate`.

The root `package.json` declares `pi.skills` as `./packages/*/skills`, so GitHub installs pick up every package without editing the root manifest.

See the [Pi package documentation](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/packages.md) for package manifests and resource discovery.
