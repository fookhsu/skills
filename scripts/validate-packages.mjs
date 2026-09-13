import { readdir, readFile } from "node:fs/promises";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";

const packagesRoot = new URL("../packages/", import.meta.url);
const rootDir = fileURLToPath(new URL("..", import.meta.url));

const skillNamePattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const frontmatterPattern = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/;
const maxNameLength = 64;
const maxDescriptionLength = 1024;
const maxCompatibilityLength = 500;

const errors = [];
const resultsByFile = new Map();

const fail = (message) => {
  errors.push(message);
};

/** Resolve a `pi.skills` path, expanding `*` segments one directory deep. */
function expandSkillPaths(baseDir, skillPath) {
  let dirs = [baseDir];
  for (const segment of skillPath.replace(/^\.\//, "").split("/")) {
    if (segment === "*") {
      dirs = dirs.flatMap((dir) =>
        existsSync(dir)
          ? readdirSync(dir, { withFileTypes: true })
              .filter((child) => child.isDirectory())
              .map((child) => join(dir, child.name))
          : [],
      );
    } else {
      dirs = dirs.map((dir) => join(dir, segment));
    }
  }
  return dirs;
}

/** A skill root holds SKILL.md directly, or one directory of skills. */
function collectSkillFiles(skillRoot) {
  const direct = join(skillRoot, "SKILL.md");
  if (existsSync(direct)) return [direct];

  return readdirSync(skillRoot, { withFileTypes: true })
    .filter((child) => child.isDirectory() && existsSync(join(skillRoot, child.name, "SKILL.md")))
    .map((child) => join(skillRoot, child.name, "SKILL.md"));
}

async function validateFrontmatter(manifestName, skillPath, file) {
  const relativePath = file.slice(rootDir.length);
  const label = `${manifestName}: ${skillPath} (${relativePath})`;
  const source = await readFile(file, "utf8");
  const match = frontmatterPattern.exec(source);

  if (!match) {
    fail(`${label}: missing YAML frontmatter delimited by ---`);
    return;
  }

  let frontmatter;
  try {
    frontmatter = parseYaml(match[1]);
  } catch (error) {
    // Unquoted scalars such as `key: text: more text` fail here, which is the exact
    // class of bug that made Pi warn "Nested mappings are not allowed in compact mappings".
    fail(`${label}: invalid YAML frontmatter: ${String(error.message).trim()}`);
    return;
  }

  if (frontmatter === null || typeof frontmatter !== "object" || Array.isArray(frontmatter)) {
    fail(`${label}: frontmatter must be a YAML mapping`);
    return;
  }

  const { name, description, compatibility } = frontmatter;

  if (typeof name !== "string" || name.length === 0) {
    fail(`${label}: frontmatter must define a non-empty string "name"`);
  } else if (name.length > maxNameLength) {
    fail(`${label}: name exceeds ${maxNameLength} characters (${name.length})`);
  } else if (!skillNamePattern.test(name)) {
    fail(`${label}: name must be lowercase letters, numbers, and single hyphens (got "${name}")`);
  } else {
    const directoryName = file.slice(0, file.lastIndexOf("/SKILL.md")).split("/").pop();
    if (name !== directoryName) {
      fail(`${label}: name "${name}" must match its directory "${directoryName}"`);
    }
  }

  if (typeof description !== "string" || description.trim().length === 0) {
    fail(`${label}: frontmatter must define a non-empty string "description"`);
  } else if (description.length > maxDescriptionLength) {
    fail(`${label}: description exceeds ${maxDescriptionLength} characters (${description.length})`);
  }

  if (
    compatibility !== undefined &&
    (typeof compatibility !== "string" || compatibility.length > maxCompatibilityLength)
  ) {
    fail(
      `${label}: compatibility must be a string of at most ${maxCompatibilityLength} characters`,
    );
  }
}

/** Validate each skill file once, even when several manifests declare the same path. */
async function ensureSkillValidated(manifestName, skillPath, file) {
  if (!resultsByFile.has(file)) {
    const errorsBefore = errors.length;
    await validateFrontmatter(manifestName, skillPath, file);
    resultsByFile.set(file, errors.length === errorsBefore);
  }
  return resultsByFile.get(file);
}

/** Validate one manifest's `pi.skills` paths. Returns true when nothing failed. */
async function validateSkills(manifestName, baseDir, skillPaths) {
  let ok = true;

  for (const skillPath of skillPaths) {
    if (skillPath.startsWith("!")) continue;

    for (const skillRoot of expandSkillPaths(baseDir, skillPath)) {
      if (!existsSync(skillRoot)) {
        fail(`${manifestName}: skill path does not exist: ${skillPath}`);
        ok = false;
        continue;
      }

      const skillFiles = collectSkillFiles(skillRoot);
      if (skillFiles.length === 0) {
        fail(`${manifestName}: no SKILL.md found under ${skillPath}`);
        ok = false;
        continue;
      }

      for (const skillFile of skillFiles) {
        if (!(await ensureSkillValidated(manifestName, skillPath, skillFile))) ok = false;
      }
    }
  }

  return ok;
}

const rootManifest = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
const rootSkills = rootManifest.pi?.skills;
if (!Array.isArray(rootSkills) || rootSkills.length === 0) {
  fail(`${rootManifest.name}: root package.json must define pi.skills`);
} else {
  await validateSkills(rootManifest.name, rootDir, rootSkills);
}

const entries = await readdir(packagesRoot, { withFileTypes: true });
const packageDirs = entries.filter((entry) => entry.isDirectory());

if (packageDirs.length === 0) {
  fail("No packages found under packages/");
}

for (const entry of packageDirs) {
  const packageDir = new URL(`../packages/${entry.name}/`, import.meta.url);
  const manifest = JSON.parse(await readFile(new URL("package.json", packageDir), "utf8"));

  if (!manifest.name || !manifest.version) {
    fail(`${entry.name}: package.json must define name and version`);
    continue;
  }

  if (!manifest.keywords?.includes("pi-package")) {
    fail(`${manifest.name}: missing pi-package keyword`);
  }

  const skills = manifest.pi?.skills;
  if (!Array.isArray(skills) || skills.length === 0) {
    fail(`${manifest.name}: pi.skills must contain at least one path`);
    continue;
  }

  if (await validateSkills(manifest.name, packageDir.pathname, skills)) {
    console.log(`OK ${manifest.name}@${manifest.version}`);
  }
}

if (errors.length > 0) {
  console.error(`\n${errors.length} validation error(s):`);
  for (const message of errors) console.error(`- ${message}`);
  process.exit(1);
}

console.log(`Validated ${resultsByFile.size} skill file(s).`);
