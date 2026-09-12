# Optional implementation demo

A demo is a **tracer bullet**: the smallest executable vertical slice that answers one architecture or behavior question. It is evidence, not production completion.

## Entry gate

Source changes require explicit user approval after the demo contract is visible. A request to “show what this might look like” approves a proposal, not file edits. If the user already specified the behavior, location, files, and permission to implement, restate that contract and proceed without asking the same question again.

Offer these dispositions:

- **Isolated demo** — preferred for an experiment. Use a managed worktree when available, or another clearly identified temporary workspace. Keep it inspectable until the user chooses to discard or integrate it.
- **In-place patch** — use the current worktree only when the user wants a reviewable project change and existing edits can be preserved safely.
- **Skip** — retain the investigation map, domain concepts, and report without implementation.

If safe isolation cannot be established, stop and explain the blocker. Do not hide a demo inside the user's current changes.

## Demo contract

Present this card before editing source:

```md
## Demo proposal
- Question/hypothesis:
- Observable behavior:
- Module interface:
- Seam and adapters:
- Location: isolated demo | in-place patch
- Expected files:
- Verification command:
- Non-goals:
- Disposition after review: integrate | keep separate | discard later
```

The contract is complete when a reviewer can distinguish success from “code was written.” It remains a hard scope gate: if implementation requires changing the approved location, expected file set, observable behavior, verification command, or non-goals, stop, present the revised contract, and obtain explicit approval before continuing.

## Bounding rules

A demo contains:

- one hypothesis;
- one caller-visible behavior;
- one entry-to-output path;
- one focused executable check;
- only the dependencies needed for that path.

Defer unrelated error branches, UI polish, migrations, broad compatibility, observability, performance tuning, and cleanup unless one is the hypothesis under test. List deferred work as non-goals rather than silently approximating production readiness.

Use existing project conventions and dependencies. Installing packages, changing schemas, starting external infrastructure, or modifying public contracts needs specific approval in the demo contract.

## Interface-first design

Read [ARCHITECTURE.md](ARCHITECTURE.md) before proposing the demo.

1. State what the caller must know: parameters, results, invariants, ordering, errors, configuration, and relevant performance behavior.
2. Put the behavior being tested behind that interface.
3. Place a seam only where behavior truly varies.
4. Choose adapters from the dependency category:
   - in-process: call directly;
   - local-substitutable: use the local stand-in;
   - remote but owned: production port plus in-memory adapter;
   - true external: narrow port plus mock adapter.
5. Verify through the module interface. Internal seams stay private.

Prefer replacing a slice of duplicated caller orchestration over adding another pass-through module. The demo should increase leverage or answer a concrete uncertainty, not merely add indirection.

## Implementation loop

### 1. Reconfirm baseline

Record revision, worktree state, demo location, and existing changes. In an isolated workspace, record the source revision. In-place, separate pre-existing files from demo files. Update the investigation map to stage `DEMO` only after approval; mark any changed previously read source `STALE`.

**Complete when:** the baseline makes accidental overwrites detectable and the investigation map names the approved demo location and contract.

### 2. Establish an executable check

Use the narrowest existing test level that exercises the proposed interface. When the repository has no suitable test harness, create a deterministic example or script that exits nonzero on failure. Record why that substitute is appropriate.

Run the check before implementation when feasible. A meaningful failing result is stronger evidence than a test added only after the implementation already passes. Do not break unrelated files merely to force a failure.

**Complete when:** the check observes the contract's caller-visible behavior and its initial state is recorded.

### 3. Implement the tracer bullet

Build the smallest vertical path from entry through the proposed module to an observable result. Keep production and test adapters distinct where the seam is real. Avoid generalized frameworks, speculative extension points, and broad cleanup.

**Complete when:** the demo behavior runs through the proposed interface without bypassing it.

### 4. Verify and inspect

Run the focused check, then the smallest relevant existing suite or static check. Capture exact commands, exit statuses, and important output. Inspect the diff and re-check worktree status.

A passing demo establishes only its stated hypothesis. Record blocked checks and environmental limitations as unknowns.

**Complete when:** evidence covers the observable behavior and every changed file is accounted for.

### 5. Report and disposition

Return:

```md
## Demo result
- Verdict: supported | contradicted | inconclusive
- Location/revision:
- Interface exercised:
- Changed files:
- Commands and results:
- What the demo establishes:
- What it does not establish:
- Residual risks:
- Recommended disposition: integrate | iterate | keep separate | discard
```

For an isolated demo, provide the durable worktree/branch/artifact location or a patch reference before cleanup. Remove it only after the user asks. For an in-place patch, leave unrelated user changes untouched and distinguish them in the report. Link every named changed source symbol under the source-link contract in [CODE-READING.md](CODE-READING.md), update coverage and affected domain evidence, and keep every generated document below 1,000 physical lines.

## Failure and stop conditions

Stop rather than widen scope when:

- the chosen behavior cannot be observed deterministically;
- required credentials or external systems are unavailable;
- isolation or preservation of user changes is uncertain;
- the demo would require an unapproved schema, dependency, public-interface, location, file-set, behavior, verification-command, or non-goal change;
- evidence contradicts the premise and a different demo would answer a different question.

Report the exact blocker and the smallest decision needed from the user.
