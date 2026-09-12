# Architecture vocabulary

Use these terms exactly when describing the codebase. Consistent language makes the reading map comparable across projects.

## Glossary

**Module**: anything with an interface and an implementation: a function, class, package, process, or tier-spanning slice. Use the scale that hides meaningful behavior.

**Interface**: everything a caller must know to use a module correctly. It includes types and methods plus invariants, ordering, error modes, configuration, and performance characteristics.

**Implementation**: behavior hidden inside a module.

**Depth**: leverage at the interface. A deep module gives callers substantial behavior through a small interface. A shallow module exposes nearly as much complexity as its implementation contains.

**Seam**: a place where behavior can vary without editing the caller. It is the location at which a module's interface lives.

**Adapter**: a concrete participant that satisfies an interface at a seam. “Adapter” describes its role, not how large its implementation is.

**Leverage**: capability callers receive per unit of interface they must learn.

**Locality**: concentration of change, bugs, knowledge, and verification in one module rather than across callers.

Prefer these words over vague substitutes when the concept is architectural. A language keyword such as TypeScript `interface` is only part of an interface in this vocabulary.

## Reading a module

For each module, record:

1. **Responsibility** — the coherent behavior it owns.
2. **Interface** — every fact callers must know.
3. **Implementation** — behavior and decisions hidden from callers.
4. **Seam** — where behavior can vary.
5. **Adapters** — concrete production and test participants at the seam.
6. **Dependencies/dependents** — modules it uses and modules that use it.
7. **Evidence** — paths, symbols, registration, tests, or runtime observations. In generated artifacts, link every named source symbol under [CODE-READING.md](CODE-READING.md).

Depth is a property of the interface, not a line-count ratio. A large implementation can still be shallow, and a small implementation can offer high leverage.

## Evaluation tests

Use these tests only after describing the current architecture.

### Deletion test

Imagine deleting the module. If complexity simply reappears in its callers, the module was providing locality. If complexity vanishes with the module because it mostly passed data through, it may be shallow.

### Caller-knowledge test

List what a correct caller must know. Duplicated ordering, validation, retry, serialization, or state-transition knowledge across callers indicates leakage across the seam.

### Test-surface test

The module's interface should be its test surface. Tests that must reach past the interface indicate that either the interface hides the wrong behavior or the test is coupled to implementation.

### Adapter test

One adapter makes a hypothetical seam. Two justified adapters make a real seam. Do not add indirection only to claim flexibility.

## Dependency categories

Classify a module's important dependencies before recommending a different seam or implementing a demo.

| Category | Examples | Testing approach |
|---|---|---|
| In-process | Pure computation, in-memory state | Exercise directly through the module interface |
| Local-substitutable | Database or filesystem with a local stand-in | Use the local stand-in behind an internal seam |
| Remote but owned | Internal HTTP/gRPC/queue dependency | Define a port at the seam; production and in-memory adapters |
| True external | Third-party provider | Inject a narrow port; production adapter and test mock adapter |

A deep module may have internal seams used by its own implementation and tests. Keep those seams private unless callers genuinely need them.

## Architecture map

Use the fewest modules that explain the scoped behavior. A broad orientation is usually readable with five to seven and never more than seven in the overview; a small project or focused trace may need fewer. A useful map explains behavior; it does not mirror every directory.

For each edge, name the relationship:

- calls;
- reads/writes;
- publishes/consumes;
- constructs/registers;
- implements an interface;
- supplies an adapter.

Label uncertain edges `INFERRED` or `UNKNOWN`. Do not draw an edge only because two files have similar names or share a directory.

## Deepening observations

When the investigation reveals friction, describe it with evidence:

- understanding one behavior requires repeated jumps across shallow modules;
- callers repeat orchestration or invariants;
- tightly coupled behavior leaks across seams;
- tests bypass the interface or recreate caller orchestration;
- a frequently changed area lacks locality.

Use recent history to prioritize only when the user asked for improvement opportunities or when an optional demo needs a useful target. Read `CONTEXT.md` and relevant ADRs first. If a potential deepening conflicts with an ADR, state the conflict and the concrete friction rather than treating the ADR as absent.

A recommendation should say what behavior moves behind which interface, where the seam lives, which adapters remain, and how leverage, locality, and tests change.
