# Pi Skills

A monorepo of [Pi](https://pi.dev/) skills, available from GitHub and npm.

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

## Packages

| Package | Description | Install | Invoke |
|---|---|---|---|
| [`codebase-lens`](./packages/codebase-lens) | Evidence-backed codebase reading with standalone HTML architecture/flow reports, impact analysis, and opt-in executable demos. | `pi install npm:codebase-lens` or [GitHub](#install) | `/codebase-lens` |

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
