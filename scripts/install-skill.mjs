#!/usr/bin/env node
/**
 * Install a skill from this monorepo into an agent's skills directory.
 *
 *   node scripts/install-skill.mjs --list
 *   node scripts/install-skill.mjs codebase-lens
 *   node scripts/install-skill.mjs codebase-lens --agent claude
 *   node scripts/install-skill.mjs codebase-lens --agent all --scope project
 *   node scripts/install-skill.mjs codebase-lens --link
 *
 * Agents:
 *   pi      ~/.pi/agent/skills       (Pi)
 *   claude  ~/.claude/skills         (Claude Code)
 *   agents  ~/.agents/skills         (Codex CLI, Cursor, Gemini CLI, Copilot, Cline, Windsurf, OpenCode)
 */

import { cp, mkdir, rm, symlink, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const packagesRoot = join(repoRoot, "packages");

const targets = {
  pi: { user: join(homedir(), ".pi", "agent", "skills"), project: join(".pi", "skills") },
  claude: { user: join(homedir(), ".claude", "skills"), project: join(".claude", "skills") },
  agents: { user: join(homedir(), ".agents", "skills"), project: join(".agents", "skills") },
};

const usage = `Install a skill from this monorepo into an agent's skills directory.

Usage:
  node scripts/install-skill.mjs <skill> [options]
  node scripts/install-skill.mjs --list

Options:
  -a, --agent <name>   ${Object.keys(targets).join(" | ")} | all   (default: all)
  -s, --scope <scope>  user | project                       (default: user)
  -d, --dir <path>     explicit destination skills directory
  -l, --link           symlink instead of copy (macOS and Linux)
      --list           list available skills
  -h, --help           show this help

Examples:
  node scripts/install-skill.mjs codebase-lens
  node scripts/install-skill.mjs codebase-lens --agent claude --scope project
  node scripts/install-skill.mjs codebase-lens --agent pi --link`;

const flags = { agent: "all", scope: "user", dir: null, link: false, list: false };
const skills = [];

for (let i = 0; i < process.argv.length - 2; i += 1) {
  const arg = process.argv[i + 2];
  if (arg === "-a" || arg === "--agent") flags.agent = process.argv[(i += 1) + 2];
  else if (arg === "-s" || arg === "--scope") flags.scope = process.argv[(i += 1) + 2];
  else if (arg === "-d" || arg === "--dir") flags.dir = process.argv[(i += 1) + 2];
  else if (arg === "-l" || arg === "--link") flags.link = true;
  else if (arg === "--list") flags.list = true;
  else if (arg === "-h" || arg === "--help") {
    console.log(usage);
    process.exit(0);
  } else if (arg.startsWith("-")) {
    console.error(`Unknown option: ${arg}\n`);
    console.log(usage);
    process.exit(1);
  } else {
    skills.push(arg);
  }
}

async function listSkills() {
  const found = [];
  for (const entry of await readdir(packagesRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const skillsDir = join(packagesRoot, entry.name, "skills");
    if (!existsSync(skillsDir)) continue;
    for (const child of await readdir(skillsDir, { withFileTypes: true })) {
      if (child.isDirectory() && existsSync(join(skillsDir, child.name, "SKILL.md"))) {
        found.push(child.name);
      }
    }
  }
  return found.sort();
}

async function resolveSource(skill) {
  for (const entry of await readdir(packagesRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const candidate = join(packagesRoot, entry.name, "skills", skill);
    if (existsSync(join(candidate, "SKILL.md"))) return candidate;
  }
  return null;
}

function resolveAgents() {
  if (flags.agent === "all") return ["claude", "agents", "pi"];
  return flags.agent.split(",").map((name) => name.trim()).filter(Boolean);
}

function resolveDestination(agent) {
  if (flags.dir) return resolve(flags.dir);
  const target = targets[agent];
  if (!target) throw new Error(`Unknown agent: ${agent}`);
  return flags.scope === "project" ? resolve(process.cwd(), target.project) : target.user;
}

if (flags.list || skills.length === 0) {
  for (const skill of await listSkills()) console.log(skill);
  if (!flags.list) {
    console.log(`\n${usage}`);
    process.exit(skills.length === 0 && !flags.list ? 1 : 0);
  }
  process.exit(0);
}

const agentList = flags.dir ? [null] : resolveAgents();

for (const agent of agentList) {
  if (agent && !targets[agent]) {
    console.error(`Unknown agent: ${agent}. Known: ${Object.keys(targets).join(", ")}, all`);
    process.exit(1);
  }
}

for (const skill of skills) {
  const source = await resolveSource(skill);
  if (!source) {
    console.error(`Skill not found: ${skill}`);
    process.exit(1);
  }

  const done = new Set();
  for (const agent of agentList) {
    const destination = join(resolveDestination(agent), skill);
    if (done.has(destination)) continue;
    done.add(destination);
    await mkdir(dirname(destination), { recursive: true });
    if (existsSync(destination)) await rm(destination, { recursive: true, force: true });
    if (flags.link) await symlink(source, destination, "dir");
    else await cp(source, destination, { recursive: true });
    console.log(`${flags.link ? "linked" : "copied"} ${skill} -> ${destination}`);
  }
}
