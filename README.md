# Pi Skills

A monorepo for independently published [Pi](https://pi.dev/) skills.

Each directory under `packages/` is a standalone npm package. Packages share the same repository, validation scripts, documentation conventions, and release workflow, while users can install each skill independently.

## Packages

| Package | Description | Install |
|---|---|---|
| [`codebase-lens`](./packages/codebase-lens) | Evidence-backed codebase orientation, flow tracing, impact analysis, vocabulary mapping, and onboarding documentation. | `pi install npm:codebase-lens` |

## Repository structure

```text
skills/
├── packages/
│   └── codebase-lens/
│       ├── package.json
│       ├── README.md
│       └── skills/
│           └── codebase-lens/
│               └── SKILL.md
├── scripts/
│   └── validate-packages.mjs
└── package.json
```

## Validate packages

```bash
npm run validate
```

## Publish one package

Publish from the package directory, or use npm workspaces from the repository root:

```bash
cd packages/codebase-lens
npm publish --access public
```

Before publishing an update, increment the package version in its own `package.json` and run the validation script.

## Add a package

1. Create `packages/<package-name>/`.
2. Add its own `package.json` with the `pi-package` keyword and `pi.skills` manifest.
3. Put the skill at `skills/<package-name>/SKILL.md`.
4. Add a package-specific `README.md`.
5. Add the package to the table above.
6. Run `npm run validate`.

See the [Pi package documentation](https://github.com/badlogic/pi-mono/blob/main/packages/coding-agent/docs/packages.md) for package manifests and resource discovery.
