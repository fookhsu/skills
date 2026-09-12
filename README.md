# Pi Skills

A monorepo of [Pi](https://pi.dev/) agent skills, available from GitHub and npm. Packages here extend Pi with reusable, installable capabilities.

The current package is **codebase-lens**, for reading unfamiliar codebases with evidence: it builds a resumable investigation map, traces behavior through modules, records domain concepts separately, analyzes change impact, and renders a self-contained HTML architecture and flow report with linked source symbols and bounded reading budgets.

Each directory under `packages/` is a standalone skill package. Packages share one repository, validation script, and documentation conventions.

## Install

Install every skill in this repository from GitHub:

```bash
pi install git:github.com/fookhsu/skills
```

Or install a single package from npm:

```bash
pi install npm:codebase-lens
```

Add `-l` to write the install to project settings (`.pi/settings.json`) instead of user settings. To remove an install later:

```bash
pi remove git:github.com/fookhsu/skills
pi remove npm:codebase-lens
```

## Use with your agent

Every skill here is a standard `SKILL.md`, so it runs on any agent that implements the [Agent Skills](https://agentskills.io/specification) specification. Only the skills directory differs:

| Agent | Skills directory | Invoke |
|---|---|---|
| Pi | `~/.pi/agent/skills/`, or `pi install` | `/skill:codebase-lens` |
| Claude Code | `~/.claude/skills/` or `<project>/.claude/skills/` | `/codebase-lens` |
| Codex CLI | `~/.agents/skills/` or `<project>/.agents/skills/` | `$codebase-lens`, or just ask |
| Cursor, Gemini CLI, GitHub Copilot, Cline, Windsurf, OpenCode | that agent's skills directory | agent-specific |

Install with one command, or copy the skill directory yourself:

```bash
node scripts/install-skill.mjs codebase-lens                   # Claude Code + Codex + Pi
node scripts/install-skill.mjs codebase-lens --agent claude
node scripts/install-skill.mjs codebase-lens --scope project
```

```bash
cp -r packages/codebase-lens/skills/codebase-lens ~/.claude/skills/
```

You do not need to memorize any parameters. Describe the task in ordinary language and the skill infers the rest:

```text
/skill:codebase-lens what is this project and where should I start reading?
trace how POST /orders in packages/api reaches a committed order
what would break if Run.status gained a new value?
```

The `key=value` control surface exists for agents and automation. See the [codebase-lens README](./packages/codebase-lens/README.md) for the full reference.

## Packages

| Package | Description | Install | Invoke |
|---|---|---|---|
| [`codebase-lens`](./packages/codebase-lens) | Resumable, evidence-backed codebase reading with read/unread maps, separate domain concepts, linked source symbols, bounded slices, HTML reports, impact analysis, and opt-in demos. | `pi install npm:codebase-lens` or [GitHub](#install) | `/skill:codebase-lens` |

## Repository structure

```text
skills/
├── packages/
│   └── codebase-lens/
│       ├── package.json
│       ├── README.md
│       └── skills/
│           └── codebase-lens/
│               ├── SKILL.md
│               └── references/
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
