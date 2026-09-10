import { readdir, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";

const packagesRoot = new URL("../packages/", import.meta.url);
const entries = await readdir(packagesRoot, { withFileTypes: true });
const packageDirs = entries.filter((entry) => entry.isDirectory());

if (packageDirs.length === 0) {
  throw new Error("No packages found under packages/");
}

for (const entry of packageDirs) {
  const packageDir = new URL(`../packages/${entry.name}/`, import.meta.url);
  const manifestPath = new URL("package.json", packageDir);
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));

  if (!manifest.name || !manifest.version) {
    throw new Error(`${entry.name}: package.json must define name and version`);
  }

  if (!manifest.keywords?.includes("pi-package")) {
    throw new Error(`${manifest.name}: missing pi-package keyword`);
  }

  const skills = manifest.pi?.skills;
  if (!Array.isArray(skills) || skills.length === 0) {
    throw new Error(`${manifest.name}: pi.skills must contain at least one path`);
  }

  for (const skillPath of skills) {
    if (skillPath.includes("*") || skillPath.startsWith("!")) {
      continue;
    }

    const skillRoot = join(packageDir.pathname, skillPath.replace(/^\.\//, ""));
    if (!existsSync(skillRoot)) {
      throw new Error(`${manifest.name}: skill path does not exist: ${skillPath}`);
    }

    const skillEntries = await readdir(skillRoot, { withFileTypes: true });
    const hasSkillFile = skillEntries.some((child) => child.isDirectory() && existsSync(join(skillRoot, child.name, "SKILL.md"))) || existsSync(join(skillRoot, "SKILL.md"));
    if (!hasSkillFile) {
      throw new Error(`${manifest.name}: no SKILL.md found under ${skillPath}`);
    }
  }

  console.log(`OK ${manifest.name}@${manifest.version}`);
}
