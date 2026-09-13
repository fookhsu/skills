#!/usr/bin/env node
/**
 * patch-region.ts — read and write the seams of a knowledge artifact (domain-agnostic)
 *
 * An artifact is made of three marker kinds, all HTML comments — legal in both HTML and Markdown shells:
 *
 *   <!-- SEAM:name --> … <!-- /SEAM:name -->        seam: the values that change (contract + data layers)
 *   <!-- META -->      … <!-- /META -->             checkpoint: entry point for resuming across sessions
 *   <!-- PROVENANCE -->… <!-- /PROVENANCE -->       provenance: trustworthiness / whether to re-run
 *
 * Layers inside a seam come in two encodings, both recognized:
 *   HTML     <script type="application/json" id="name-schema"> … </script>
 *   Markdown ```json name-schema
 *             …
 *            ```
 *
 * Usage:
 *   node patch-region.ts list         <file>
 *   node patch-region.ts check        <file>                     # validate each seam against its contract
 *   node patch-region.ts meta         <file>                     # print the checkpoint (resume entry point)
 *   node patch-region.ts stale        <file>                     # whether a derived artifact is stale
 *   node patch-region.ts schema       <file> <seam>
 *   node patch-region.ts extract      <file> <seam>
 *   node patch-region.ts diff         <file> <seam> <new.json>
 *   node patch-region.ts apply        <file> <seam> <new.json>
 *   node patch-region.ts apply-schema <file> <seam> <new-schema.json> [--force]
 *   node patch-region.ts drift        <file> <seam> <new-schema.json>
 *
 * Exit codes: 0 success; 1 structural/validation failure (no file written).
 */
import { readFileSync, writeFileSync, statSync } from 'node:fs';
import { resolve, dirname } from 'node:path';

/* ============================== types ============================== */

type Kind = 'text' | 'enum' | 'int' | 'number' | 'bool' | 'json';

interface FieldSpec {
  label?: string;
  kind?: Kind;
  options?: string[];
  required?: boolean;
  unique?: boolean;
  min?: number;
  max?: number;
  default?: unknown;
  hint?: string;
}

interface Contract {
  title?: string;
  itemLabel?: string;
  order?: string[];
  fields: Record<string, FieldSpec>;
}

interface Layer { id: string; kind: 'schema' | 'data'; inner: string; full: string; at: number; }

interface Seam {
  name: string;
  bodyStart: number;
  bodyEnd: number;
  layers: Layer[];
}

interface MetaBlock {
  title?: string;
  purpose?: string;
  status?: string;
  next?: string;
  'done-when'?: string;
  decisions?: string[];
}

interface ProvenanceBlock {
  'generated-from'?: string;
  'generated-at'?: string;
  procedure?: string;
}

type Json = unknown;

/* ============================== helpers ============================== */

const die = (m: string): never => { console.error('✕ ' + m); process.exit(1); };
const bytes = (s: string) => Buffer.byteLength(s, 'utf8');
const rx = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const blank = (v: unknown) => v === undefined || v === null || String(v).trim() === '';

function fieldOrder(c: Contract): string[] {
  return c.order ?? Object.keys(c.fields ?? {});
}

/* ============================== parsing ============================== */

/** Find a JSON layer inside a seam: HTML script first, then a Markdown fence. */
function findLayer(src: string, id: string, from: number, to: number): Layer | null {
  const region = src.slice(from, to);

  // 1) HTML script block
  const scriptRe = new RegExp(
    '<script[^>]*type=["\']application/json["\'][^>]*id=["\']' + rx(id) +
    '["\'][^>]*>([\\s\\S]*?)<\\/script>');
  const sm = region.match(scriptRe);
  if (sm) {
    const full = sm[0];
    return { id, kind: id.endsWith('-schema') ? 'schema' : 'data', inner: sm[1], full, at: from + sm.index! };
  }

  // 2) Markdown fence: ```json <id>  …  ```
  const fenceRe = new RegExp(
    '(^|\\n)```json[ \\t#]*' + rx(id) + '[^\\n]*\\n([\\s\\S]*?)\\n```', 'm');
  const fm = region.match(fenceRe);
  if (fm) {
    const full = fm[0];
    return { id, kind: id.endsWith('-schema') ? 'schema' : 'data', inner: fm[2], full, at: from + (fm.index ?? 0) };
  }

  return null;
}

/** Scan all seams. */
function scanSeams(src: string): Seam[] {
  const seams: Seam[] = [];
  const open = /<!--\s*SEAM:([A-Za-z0-9_.-]+)\s*-->/g;
  let m: RegExpExecArray | null;
  while ((m = open.exec(src)) !== null) {
    const name = m[1];
    const bodyStart = m.index + m[0].length;
    const tail = src.slice(bodyStart);
    const cm = tail.match(new RegExp('<!--\\s*/SEAM:' + rx(name) + '\\s*-->'));
    if (!cm) die(`Seam <${name}> is missing its closing marker <!-- /SEAM:${name} -->`);
    const bodyEnd = bodyStart + cm.index!;
    const layers: Layer[] = [];
    for (const id of [name + '-schema', name + '-data']) {
      const l = findLayer(src, id, bodyStart, bodyEnd);
      if (l) layers.push(l);
    }
    seams.push({ name, bodyStart, bodyEnd, layers });
    open.lastIndex = bodyEnd;
  }
  return seams;
}

const getSeam = (src: string, name: string): Seam => {
  const s = scanSeams(src).find((x) => x.name === name);
  if (!s) die(`Seam <${name}> not found. Available: ${scanSeams(src).map((x) => x.name).join(', ') || '(none)'}`);
  return s;
};

const layerOf = (seam: Seam, suffix: 'schema' | 'data'): Layer => {
  const l = seam.layers.find((x) => x.kind === suffix);
  if (!l) die(`Seam <${seam.name}> is missing its ${seam.name}-${suffix} layer`);
  return l;
};

const readJson = (l: Layer): Json => {
  try { return JSON.parse(l.inner); }
  catch (e) { die(`Layer ${l.id} is not valid JSON: ${(e as Error).message}`); }
};

const readSchema = (seam: Seam): Contract => readJson(layerOf(seam, 'schema')) as Contract;
const readData = (seam: Seam): Json => readJson(layerOf(seam, 'data'));

/** Read a single-object block wrapped in its own markers (META / PROVENANCE). */
function readBlock(src: string, tag: string): Json | null {
  const openRe = new RegExp('<!--\\s*' + tag + '\\s*-->');
  const closeRe = new RegExp('<!--\\s*/' + tag + '\\s*-->');
  const om = src.match(openRe);
  if (!om) return null;
  const bodyStart = om.index! + om[0].length;
  const cm = src.slice(bodyStart).match(closeRe);
  if (!cm) die(`<!-- ${tag} --> is missing its closing marker <!-- /${tag} -->`);
  const region = src.slice(bodyStart, bodyStart + cm.index!);

  // script or fence, either one
  let m = region.match(/<script[^>]*>([\s\S]*?)<\/script>/);
  if (!m) m = region.match(/```(?:json)?[^\n]*\n([\s\S]*?)\n```/);
  if (!m) die(`No JSON block found inside <!-- ${tag} -->`);
  try { return JSON.parse(m[1]); }
  catch (e) { die(`${tag} is not valid JSON: ${(e as Error).message}`); }
}

/* ============================== validation ============================== */

/** Validate data against the contract — the single validation implementation shared by both ends (browser / tool). */
function validate(data: Json, contract: Contract): string[] {
  const errs: string[] = [];
  if (!Array.isArray(data)) return ['data top level is not an array'];
  const fields = contract.fields ?? {};
  const order = fieldOrder(contract);
  const seen: Record<string, Record<string, number>> = {};

  data.forEach((row, i) => {
    if (typeof row !== 'object' || row === null) { errs.push(`#${i + 1} is not an object`); return; }
    const r = row as Record<string, unknown>;
    order.forEach((f) => {
      const spec = fields[f];
      if (!spec) return;
      const v = r[f];
      if (spec.required && blank(v)) { errs.push(`#${i + 1} ${f} is required but empty`); return; }
      if (blank(v)) return;
      if (spec.kind === 'enum' && spec.options && spec.options.indexOf(String(v)) < 0)
        errs.push(`#${i + 1} ${f} value "${v}" is not in options`);
      if (spec.kind === 'int') {
        const n = Number(v);
        if (!Number.isInteger(n)) errs.push(`#${i + 1} ${f} must be an integer: ${v}`);
        else if (spec.min !== undefined && n < spec.min) errs.push(`#${i + 1} ${f} is below min=${spec.min}`);
        else if (spec.max !== undefined && n > spec.max) errs.push(`#${i + 1} ${f} is above max=${spec.max}`);
      }
      if (spec.unique) {
        seen[f] = seen[f] ?? {};
        const k = String(v).trim();
        if (seen[f][k] !== undefined) errs.push(`#${i + 1} ${f} duplicates #${seen[f][k] + 1}: ${k}`);
        else seen[f][k] = i;
      }
    });
  });
  return errs;
}

/* ============================== contract change ============================== */

function drift(oldC: Contract, newC: Contract, data: Json): {
  added: { field: string; need: number; total: number; wasOptional?: boolean }[];
  removed: { field: string; carrying: number }[];
  narrowed: { field: string; value: string; rows: number[] }[];
  retyped: { field: string; from: string; to: string }[];
  issues: string[];
} {
  const of = oldC.fields ?? {}, nf = newC.fields ?? {};
  const rows = (Array.isArray(data) ? data : []) as Record<string, unknown>[];
  const added: { field: string; need: number; total: number; wasOptional?: boolean }[] = [];
  const removed: { field: string; carrying: number }[] = [];
  const narrowed: { field: string; value: string; rows: number[] }[] = [];
  const retyped: { field: string; from: string; to: string }[] = [];

  for (const f of Object.keys(nf)) {
    if (!(f in of)) {
      added.push({ field: f, need: rows.filter((r) => blank(r[f])).length, total: rows.length });
      continue;
    }
    const a = of[f], b = nf[f];
    if (a.kind === 'enum' && b.kind === 'enum' && a.options && b.options) {
      for (const o of a.options.filter((o) => b.options!.indexOf(o) < 0)) {
        const hit: number[] = [];
        rows.forEach((r, i) => { if (r[f] === o) hit.push(i + 1); });
        if (hit.length) narrowed.push({ field: f, value: o, rows: hit });
      }
    }
    if ((a.kind ?? 'text') !== (b.kind ?? 'text')) retyped.push({ field: f, from: a.kind ?? 'text', to: b.kind ?? 'text' });
    if (b.required && !a.required)
      added.push({ field: f, need: rows.filter((r) => blank(r[f])).length, total: rows.length, wasOptional: true });
  }
  for (const f of Object.keys(of)) {
    if (!(f in nf))
      removed.push({ field: f, carrying: rows.filter((r) => !blank(r[f])).length });
  }
  return { added, removed, narrowed, retyped, issues: validate(data, newC) };
}

/* ============================== write-back ============================== */

function swapLayer(src: string, seam: Seam, kind: 'schema' | 'data', value: Json): string {
  const l = layerOf(seam, kind);
  const inner = '\n' + JSON.stringify(value, null, 2) + '\n';
  return src.slice(0, l.at) + l.full.replace(l.inner, inner) + src.slice(l.at + l.full.length);
}

/* ============================== commands ============================== */

const [, , cmd, file, seamName, arg] = process.argv;

function usage(): void {
  console.log(`Usage:
  node patch-region.ts list         <file>
  node patch-region.ts check        <file>
  node patch-region.ts meta         <file>
  node patch-region.ts stale        <file>
  node patch-region.ts schema       <file> <seam>
  node patch-region.ts extract      <file> <seam>
  node patch-region.ts diff         <file> <seam> <new.json>
  node patch-region.ts apply        <file> <seam> <new.json>
  node patch-region.ts apply-schema <file> <seam> <new-schema.json> [--force]
  node patch-region.ts drift        <file> <seam> <new-schema.json>`);
  process.exit(0);
}
if (!cmd || !file) usage();

const src = readFileSync(file, 'utf8');
const total = bytes(src);

if (cmd === 'list' || cmd === 'check') {
  const seams = scanSeams(src);
  const meta = readBlock(src, 'META') as MetaBlock | null;
  const prov = readBlock(src, 'PROVENANCE') as ProvenanceBlock | null;

  console.log(`${file}  ${total} bytes`);
  if (meta) console.log(`  META        ${meta.title ?? '(untitled)'} · status=${meta.status ?? '?'} · next=${meta.next ?? '?'}`);
  else console.log(`  META        none — a fresh session cannot orient quickly (consider adding a checkpoint)`);
  if (prov) console.log(`  PROVENANCE  generated-from=${prov['generated-from'] ?? '?'} · at=${prov['generated-at'] ?? '?'}`);
  console.log();

  if (!seams.length) die('no seams found — this artifact cannot be revised cheaply.');
  let patchable = 0, churn = 0, problems = 0;
  for (const s of seams) {
    const b = bytes(src.slice(s.bodyStart, s.bodyEnd));
    patchable += b;
    const sch = layerOf(s, 'schema');
    const dat = layerOf(s, 'data');
    const sb = bytes(sch.full), db = bytes(dat.full);
    churn += db;
    let status: string;
    try {
      const schema = readSchema(s), data = readData(s);
      const errs = cmd === 'check' ? validate(data, schema) : [];
      status = errs.length
        ? `✕ ${errs.length} violation(s) (${errs[0]}${errs.length > 1 ? ' …' : ''})`
        : `✓ ${Array.isArray(data) ? data.length + ' item(s)' : 'object'} × ${fieldOrder(schema).length} fields, valid`;
      if (errs.length) problems++;
    } catch (e) { status = '✕ ' + (e as Error).message; problems++; }
    console.log(`  SEAM:${s.name}  ${b} bytes  ${(100 * b / total).toFixed(1)}%  (contract ${sb} / data ${db})  ${status}`);
  }
  console.log();
  console.log(`Patchable     ${patchable} bytes = ${(100 * patchable / total).toFixed(2)}% of file`);
  console.log(`  data layer   ${churn} bytes = ${(100 * churn / total).toFixed(2)}%  ← tuning rewrites only this`);
  console.log(`  contract     ${patchable - churn} bytes = ${(100 * (patchable - churn) / total).toFixed(2)}%  ← changes rarely, amortised`);
  console.log(`shell+frozen ${total - patchable} bytes = ${(100 * (total - patchable) / total).toFixed(2)}% (never touched)`);
  process.exit(problems ? 1 : 0);
}

if (cmd === 'meta') {
  const m = readBlock(src, 'META') as MetaBlock | null;
  if (!m) die('no META checkpoint. Authored artifacts may skip it; derived ones should carry it, or a fresh session cannot orient.');
  console.log(JSON.stringify(m, null, 2));
  process.exit(0);
}

if (cmd === 'stale') {
  const p = readBlock(src, 'PROVENANCE') as ProvenanceBlock | null;
  if (!p) { console.log('no PROVENANCE — an authored artifact needs no freshness check (it is its own source).'); process.exit(0); }
  const gf = p['generated-from'];
  const ga = p['generated-at'];
  console.log(`generated-from: ${gf ?? '?'}`);
  console.log(`generated-at  : ${ga ?? '?'}`);
  if (gf && gf.indexOf('/') >= 0) {
    const path = resolve(dirname(file), gf);
    try {
      const st = statSync(path);
      const newer = ga ? st.mtimeMs > new Date(ga).getTime() : true;
      console.log(newer
        ? `✕ STALE — input ${gf} is newer than the artifact; conclusions may be outdated. Re-run.`
        : `✓ FRESH — input unchanged; conclusions still hold.`);
      process.exit(newer ? 1 : 0);
    } catch { console.log(`⚠ input path ${gf} is not accessible (resolved to ${path} relative to this file).`); process.exit(0); }
  } else {
    console.log('generated-from is not a path; cannot compare automatically — judge manually.');
    process.exit(0);
  }
}

if (!seamName) die('missing seam name');
const seam = getSeam(src, seamName);

if (cmd === 'schema') { process.stdout.write(JSON.stringify(readSchema(seam), null, 2) + '\n'); process.exit(0); }
if (cmd === 'extract') { process.stdout.write(JSON.stringify(readData(seam), null, 2) + '\n'); process.exit(0); }

if (cmd === 'diff' || cmd === 'apply') {
  if (!arg) die('missing patch file path');
  const contract = readSchema(seam);
  const next = JSON.parse(readFileSync(arg, 'utf8'));
  const errs = validate(next, contract);
  if (errs.length) die('violates the contract, not written:\n  ' + errs.join('\n  '));
  const cur = readData(seam);

  if (cmd === 'diff') {
    const a = JSON.stringify(cur, null, 2).split('\n');
    const b = JSON.stringify(next, null, 2).split('\n');
    let shown = 0;
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
      if (a[i] !== b[i]) {
        console.log(`~ line ${i + 1}`);
        if (a[i] !== undefined) console.log(`  - ${a[i]}`);
        if (b[i] !== undefined) console.log(`  + ${b[i]}`);
        if (++shown >= 24) { console.log('  …(truncated)'); break; }
      }
    }
    if (!shown) console.log('no differences');
  } else {
    writeFileSync(file, swapLayer(src, seam, 'data', next));
    console.log(`✓ patched seam <${seamName}> in ${file}`);
  }
  const region = bytes(src.slice(seam.bodyStart, seam.bodyEnd));
  console.log(`  items: ${Array.isArray(cur) ? cur.length : '?'} → ${Array.isArray(next) ? next.length : '?'}`);
  console.log(`  seam bytes: ${region} / ${total} = ${(100 * region / total).toFixed(2)}%`);
  console.log(`  shell+frozen ${(100 * (1 - region / total)).toFixed(2)}% untouched`);
  process.exit(0);
}

if (cmd === 'apply-schema') {
  if (!arg) die('missing contract file path');
  const next = JSON.parse(readFileSync(arg, 'utf8')) as Contract;
  if (!next.fields) die('new contract is missing its fields section');
  const data = readData(seam);
  const r = drift(readSchema(seam), next, data);
  const blocking = r.narrowed.length + r.issues.length + r.added.filter((x) => x.need).length;
  if (blocking && !process.argv.includes('--force')) {
    console.error(`✕ ${blocking} unresolved item(s). Run drift, migrate the data, then return.`);
    console.error('  Add --force only if you know what you are doing.');
    process.exit(1);
  }
  writeFileSync(file, swapLayer(src, seam, 'schema', next));
  console.log(`✓ updated the contract layer of seam <${seamName}> in ${file}`);
  console.log(`  fields: ${fieldOrder(next).length} · data unchanged (both ends follow)`);
  process.exit(0);
}

if (cmd === 'drift') {
  if (!arg) die('missing contract file path');
  const oldC = readSchema(seam);
  const newC = JSON.parse(readFileSync(arg, 'utf8')) as Contract;
  const data = readData(seam);
  const r = drift(oldC, newC, data);
  const n = Array.isArray(data) ? data.length : 0;

  console.log(`Migration list: contract of seam <${seamName}> will change; ${n} data item(s) affected\n`);
  if (r.added.length) {
    console.log(`  Added fields (${r.added.length})`);
    r.added.forEach((x) => console.log(
      `    + ${x.field.padEnd(16)} ${x.need}/${x.total} row(s) need a value${x.wasOptional ? ' (optional → required)' : ''}`));
  }
  if (r.removed.length) {
    console.log(`\n  Removed fields (${r.removed.length})`);
    r.removed.forEach((x) => console.log(`    - ${x.field.padEnd(16)} ${x.carrying} row(s) carry this value and will lose it`));
  }
  if (r.narrowed.length) {
    console.log(`\n  Narrowed enums (${r.narrowed.length})`);
    r.narrowed.forEach((x) => console.log(
      `    ~ ${x.field.padEnd(16)} value "${x.value}" removed from options → rows ${x.rows.map((i) => '#' + i).join(', ')}`));
  }
  if (r.retyped.length) {
    console.log(`\n  Type changes (${r.retyped.length})`);
    r.retyped.forEach((x) => console.log(`    ~ ${x.field.padEnd(16)} ${x.from} → ${x.to}`));
  }
  if (!r.added.length && !r.removed.length && !r.narrowed.length && !r.retyped.length)
    console.log('  no structural change to the contract');

  if (r.issues.length) {
    console.log(`\n  Violations of current data under the new contract (${r.issues.length})`);
    r.issues.slice(0, 12).forEach((e) => console.log(`    ✕ ${e}`));
    if (r.issues.length > 12) console.log(`    …${r.issues.length - 12} more`);
  } else {
    console.log('\n  ✓ current data is still valid under the new contract');
  }

  const blocking = r.narrowed.length + r.issues.length + r.added.filter((x) => x.need).length;
  console.log(`\n  Human decisions needed: ${blocking} · the change lands in one place (the contract layer); both ends follow`);
  process.exit(0);
}

die(`unknown command: ${cmd}`);
