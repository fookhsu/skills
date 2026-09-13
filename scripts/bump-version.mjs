import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Bump a workspace package version in package.json and package-lock.json together.
 *
 * npm records each workspace version in the lockfile but never verifies it, so
 * hand-editing package.json silently desyncs the two files. This script is the
 * single entry point for version bumps.
 *
 * Usage:
 *   npm run bump -- patch|minor|major
 *   npm run bump -- 0.4.0
 *   npm run bump -- minor --package codebase-lens --dry-run
 */

const rootDir = fileURLToPath(new URL("..", import.meta.url));
const packagesDir = join(rootDir, "packages");
const lockfilePath = join(rootDir, "package-lock.json");
const rootManifestPath = join(rootDir, "package.json");

const semverPattern = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/;
const releaseTypes = ["major", "minor", "patch"];

const die = (message) => {
  console.error(`bump: ${message}`);
  process.exit(1);
};

/** Write JSON the way npm does: two-space indent, trailing newline. */
const writeJson = (path, value) => writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");

function parseArgs(argv) {
  const options = { target: undefined, packageName: undefined, dryRun: false };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--dry-run" || arg === "-n") {
      options.dryRun = true;
    } else if (arg === "--package" || arg === "-p") {
      options.packageName = argv[index + 1];
      index += 1;
      if (!options.packageName) die("--package requires a package name");
    } else if (arg.startsWith("-")) {
      die(`unknown option "${arg}"`);
    } else if (options.target === undefined) {
      options.target = arg;
    } else {
      die(`unexpected argument "${arg}"`);
    }
  }

  if (!options.target) {
    die(`missing version. Usage: npm run bump -- <${releaseTypes.join("|")}|x.y.z> [--package <name>] [--dry-run]`);
  }

  return options;
}

function nextVersion(current, target) {
  if (releaseTypes.includes(target)) {
    const match = semverPattern.exec(current);
    if (!match) die(`current version "${current}" is not valid semver`);
    const [major, minor, patch] = match.slice(1, 4).map(Number);

    if (target === "major") return `${major + 1}.0.0`;
    if (target === "minor") return `${major}.${minor + 1}.0`;
    return `${major}.${minor}.${patch + 1}`;
  }

  if (!semverPattern.test(target)) die(`"${target}" is not a release type or a valid semver version`);
  return target;
}

const options = parseArgs(process.argv.slice(2));

const entries = (await readdir(packagesDir, { withFileTypes: true })).filter((entry) =>
  entry.isDirectory(),
);

if (entries.length === 0) die("no packages found under packages/");

const lockfile = JSON.parse(await readFile(lockfilePath, "utf8"));
const changes = [];

for (const entry of entries) {
  const manifestPath = join(packagesDir, entry.name, "package.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));

  if (options.packageName && manifest.name !== options.packageName) continue;
  if (!manifest.version) die(`${entry.name}: package.json has no version`);

  const lockKey = `packages/${entry.name}`;
  const locked = lockfile.packages?.[lockKey];

  if (!locked) {
    die(`package-lock.json has no "${lockKey}" entry — run "npm install --package-lock-only" first`);
  }

  const version = nextVersion(manifest.version, options.target);
  if (version === manifest.version) die(`${manifest.name} is already at ${version}`);

  changes.push({ manifestPath, manifest, lockKey, locked, name: manifest.name, from: manifest.version, version });
}

if (changes.length === 0) {
  die(
    options.packageName
      ? `no package named "${options.packageName}" under packages/`
      : "no packages matched",
  );
}

// The root manifest is private and may stay unversioned; mirror its version into
// the lockfile root entry when it does carry one.
const rootManifest = JSON.parse(await readFile(rootManifestPath, "utf8"));
if (rootManifest.version && lockfile.packages?.[""]) {
  lockfile.packages[""].version = rootManifest.version;
}

for (const change of changes) {
  change.manifest.version = change.version;
  change.locked.version = change.version;

  const linked = lockfile.packages?.[`node_modules/${change.name}`];
  if (linked?.version) linked.version = change.version;
}

if (!options.dryRun) {
  for (const change of changes) {
    await writeJson(change.manifestPath, change.manifest);
  }
  await writeJson(lockfilePath, lockfile);
}

const prefix = options.dryRun ? "would bump" : "bumped";
for (const change of changes) {
  console.log(`${prefix} ${change.name}: ${change.from} -> ${change.version}`);
}
console.log(
  options.dryRun
    ? "dry run: no files written"
    : `updated ${changes.length} package.json file(s) and package-lock.json`,
);

if (!options.dryRun) {
  const tags = changes.map((change) => `v${change.version}`).join(" ");
  console.log("\nNext steps:");
  console.log(`  npm run validate`);
  console.log(`  git commit -am "chore: release ${changes.map((c) => `${c.name}@${c.version}`).join(", ")}"`);
  console.log(`  git tag ${tags} && git push --follow-tags`);
}
