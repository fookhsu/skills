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
│   └── validate-packages.mjs
└── package.json
```

## Validate packages

```bash
npm run validate
```

## CI/CD

GitHub Actions runs `npm run validate` on every push to `main` and on every pull request (`.github/workflows/ci.yml`).

Publishing to npm (`.github/workflows/publish.yml`) runs when a tag matching `v*` is pushed, or manually via the **Publish** workflow's *Run workflow* button. The tag must match `packages/codebase-lens/package.json`'s `version` (for example, tag `v1.2.3` for version `1.2.3`).

The publish job uses npm **trusted publishing** (OIDC), so no `NPM_TOKEN` secret is needed. Configure the trusted publisher once at `https://www.npmjs.com/package/codebase-lens/access` → **Trusted publishing** → GitHub Actions, using exactly these values:

| Field | Value |
|---|---|
| Repository | `fookhsu/skills` |
| Workflow filename | `publish.yml` |
| Environment | leave blank |

Then release with:

```bash
# bump the version without creating a tag yet
npm version patch -w codebase-lens --no-git-tag-version
git commit -am "chore(release): codebase-lens $(node -p "require('./packages/codebase-lens/package.json').version")"
# tag and push; the tag triggers the publish workflow
git tag "v$(node -p "require('./packages/codebase-lens/package.json').version")"
git push origin main --follow-tags
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
