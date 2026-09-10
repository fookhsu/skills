# codebase-lens

An evidence-backed Pi skill for understanding unfamiliar code projects.

It helps Pi build a practical project map instead of producing a speculative directory tour. The skill supports project orientation, feature-flow tracing, change-impact analysis, verification, project-specific investigation strategies, and a shared vocabulary bridge between the codebase, the user, and the model.

## What it does

- Detects the project's language, framework, entry points, and run commands.
- Maps major components and recommends a dependency-ordered reading path.
- Traces a request, command, page, event, or job from entry to output.
- Analyzes the likely blast radius of a file, symbol, diff, or feature.
- Records evidence using `SOURCE`, `RUNTIME`, `INFERRED`, `UNKNOWN`, and `CONTRADICTED` labels.
- Captures canonical project terms, code names, aliases, boundaries, and confusing concepts.
- Creates or updates a root `ONBOARDING.md` with a Mermaid architecture diagram.
- Uses parallel read-only Pi subagents for broad investigations when available.

## Install

```bash
pi install npm:codebase-lens
```

## Use

Invoke it manually in Pi:

```text
/codebase-lens
```

Example requests:

```text
Use codebase-lens in ORIENT mode. Explain this repository and give me a reading path.

Use codebase-lens in TRACE mode. Trace how an authenticated upload reaches storage.

Use codebase-lens in IMPACT mode. What could change if I modify this service?
```

The skill is user-invoked by default so a full project investigation does not start unexpectedly during ordinary coding work.

## Generated artifact

After an orientation or a materially useful focused investigation, the skill creates or updates:

```text
ONBOARDING.md
```

The document includes the detected stack, architecture map, Mermaid diagram, startup flow, component map, project vocabulary, tests, configuration, recommended reading order, and unresolved questions. Existing manual content is preserved.

## Safety

Pi packages run with full system access. This package contains a skill that instructs the model how to inspect repositories and write `ONBOARDING.md`. Review the skill source before installing or using it in sensitive repositories.

## License

MIT
