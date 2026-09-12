# codebase-lens

An evidence-backed Pi skill for reading unfamiliar codebases and, when explicitly requested, validating one understanding or design with a bounded executable demo.

`codebase-lens` follows behavior through modules instead of producing a speculative directory tour. Its reading framework combines behavior, module, data, change, and evidence lenses.

## What it does

- Detects project scope, language, framework, entry points, and configured commands.
- Traces a request, command, page, event, or job from registration to output and side effects.
- Maps the fewest meaningful modules needed to explain the scope, using a consistent architecture vocabulary: interface, implementation, depth, seam, adapter, leverage, and locality.
- Analyzes the likely blast radius of a file, symbol, diff, or feature.
- Separates `SOURCE`, `RUNTIME`, `INFERRED`, `UNKNOWN`, and `CONTRADICTED` evidence.
- Captures canonical project terms, aliases, overloaded names, and unresolved vocabulary.
- Generates and opens a self-contained temporary HTML report by default, with response-only and approved durable-path alternatives.
- Uses parallel read-only Pi subagents for broad investigations when available.
- Offers—but never silently starts—an isolated demo or in-place patch to test one bounded hypothesis.

## Install

From npm:

```bash
pi install npm:codebase-lens
```

Or from GitHub (installs every skill in the repository):

```bash
pi install git:github.com/fookhsu/skills
```

Add `-l` to write the install to project settings (`.pi/settings.json`) instead of user settings.

## Use

The skill is user-invoked so a repository-wide investigation does not start during ordinary coding work:

```text
/codebase-lens
```

Choose a mode explicitly, or let the skill infer the smallest one:

```text
Use codebase-lens in ORIENT mode. Explain this repository and give me a reading path.

Use codebase-lens in TRACE mode. Trace how an authenticated upload reaches storage.

Use codebase-lens in IMPACT mode. What could change if I add a Run.status value?

Use codebase-lens in VERIFY mode. Check whether this architecture explanation matches the code.

Use codebase-lens to trace checkout, then propose an isolated DEMO of a smaller checkout interface.
```

| Mode | Purpose |
|---|---|
| `ORIENT` | Build an architecture map and dependency-ordered reading path |
| `TRACE` | Follow one behavior from entry to output and side effects |
| `IMPACT` | Analyze the blast radius of a target change |
| `VERIFY` | Confirm, contradict, or leave conclusions unresolved using independent evidence |
| `DEMO` | Implement one explicitly approved executable tracer bullet |

## Optional demo safety

Reading starts source-read-only. Before a demo edits code, the skill presents a contract with the hypothesis, observable behavior, proposed interface and seam, expected files, verification command, and non-goals. The user then chooses:

- **isolated demo** — preferred for throwaway experiments;
- **in-place patch** — a reviewable project change;
- **skip** — keep the codebase map without implementation.

The demo is intentionally not production completion. Its result states what the experiment establishes, what remains unknown, all changed files, commands run, and whether to integrate, iterate, keep separate, or discard it.

## Generated HTML report

By default, every completed investigation securely creates a fresh report outside the project:

```text
<os-temp-dir>/codebase-lens-<repo>-<mode>-<timestamp>-<random>.html
```

The skill opens the report and returns its absolute path. Alternatively, the user can request response-only output, which creates no file, or approve one durable path, which creates only that file. The report is standalone and works offline: HTML5, inline CSS, semantic tables, and stable CSS/SVG visuals with no Mermaid, CDN, or build step.

Visuals are selected by mode:

- fixed tracks for architecture;
- an ordered rail for execution flow;
- four evidence bands for impact analysis;
- contradiction-first verdict rows for verification.

Complex or cyclic relationships are represented in the evidence table instead of forcing crossing diagram lines. A report is written inside the repository only when the user requests a durable artifact and approves its path.

## Package contents

```text
skills/codebase-lens/
├── SKILL.md
└── references/
    ├── ARCHITECTURE.md
    ├── CODE-READING.md
    ├── DEMO.md
    └── HTML-REPORT.md
```

## Safety

Pi packages run with full system access. This package contains instructions for inspecting repositories, writing a temporary HTML report, opening it locally, and—only after explicit approval—implementing a bounded demo. Review the skill before using it in sensitive repositories.

## License

MIT
