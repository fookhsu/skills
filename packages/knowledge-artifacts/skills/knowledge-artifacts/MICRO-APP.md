# Micro-app

A disposable editor for **one seam**. It exists so that revising values stops being a conversation with a model and becomes a form.

Say the shape out loud: it is *micro-software on top of micro-software* — a custom UI for a module of a custom artifact. It is meant to be thrown away the moment the seam is settled.

## When it is worth building

The editor is generated once and then costs nothing. The alternative — asking a model to rewrite the artifact — costs a full round trip **every** revision.

Measured with `cl100k_base` on a ~5,200-token plan holding a ~2,300-byte data layer:

| Revisions | Rewrite the artifact | Edit the seam only | Micro-app |
|---:|---:|---:|---:|
| 1 | ~10,400 | ~7,600 | ~8,300 |
| 5 | ~51,900 | ~37,800 | **~9,800** |
| 20 | ~207,500 | ~151,200 | **~9,800** |

Three facts:

- Rewriting is **linear in revisions**; a micro-app is **constant after generation**.
- **Break-even is the first or second revision.** One editor ≈ one full round trip.
- Every revision a human does in the browser costs **zero tokens**. That is the entire return.

Build one when a seam will be revised twice or more, or when the people revising it are not the ones who wrote it. Skip it for a one-off and for prose — a form cannot help someone think.

A **contract** change does not invalidate an editor built this way: the seed re-projects from the new contract and the editor's own code is untouched.

## The seven requirements

Each one closes a failure mode that shows up in practice.

**1. Derived, not declared.** Controls, labels, defaults and validation all come from the **contract layer**; the editor holds no field list of its own. Enum fields become `<select>` — hand-typing `hstogram` into a text box is the thing you are here to prevent — `int` becomes `<input type="number" min max>`, and only genuinely free text becomes a `<textarea>`. An editor that restates the contract is a second contract.

**2. Add, delete, duplicate, and reorder.** Reorder is first-class, because "order means priority" is exactly the semantics that plain text mangles.

**3. Per-field before/after.** Every changed field shows its original value beside it. The reviewer should never have to remember what they touched.

**4. In-place validation.** Errors render next to the field that caused them. The rules are the contract's, not the editor's — so the browser check and `patch-region.ts check` agree by construction.

**5. Autosave plus explicit export.** `localStorage` catches the misclick; the export button catches the closed tab. When storage is unavailable, say so rather than failing silently.

**6. Preserve unknown fields.** Round-trip the objects you were given. A field your editor does not recognise is a field it must not delete. Enum values outside the contract stay in the select as `(outside the contract)` rather than being silently rewritten.

**7. One self-contained file, one job.** No auth, no database, no navigation, no build step. Opening it by double-click is the install.

Two export formats, both required: **JSON** for the patch, and a **Markdown table** for humans reading the artifact without the tool.

## The prompt

```
Build an editable HTML artifact for seam <SEAM>. I do not like editing it inside <FILE>.
Build a focused custom interface that gives me structure and flexibility: add, remove, reorder, and edit controls.
Preserve every source field, and add a copy button that exports the revised <FORMAT>.
Design the ideal interface for this specific job.
Derive all controls, labels, defaults and validation from the contract layer below — do not restate a field list in the UI.

[paste the contract layer <SEAM>-schema]
[paste the data layer <SEAM>-data]
```

Paste **both layers**. With the contract in hand the editor derives its controls instead of inventing them, and the two ends cannot drift.

## Failure modes

| Symptom | Target behaviour to ask for |
|---|---|
| Editor drops or renames source fields | Hand it a representative input object **and** the exact output schema; tell it to preserve unrecognised keys and show a before/after diff |
| Edits vanish on reload | Import/export controls plus local storage; export a copy before closing |
| It builds a whole application instead of an editor | Restate the single job; one self-contained file; strip auth, databases, navigation |
| Export cannot be pasted back | Add a validator against the schema and render errors beside the offending field |
| Enums become free text | Selects for every value that has a fixed set |
| The editor has its own copy of the field list | Tell it to read the contract layer; a field list in the editor is a second contract |

## Verify before you hand it over

The editor's seed and the artifact's seam must match on **both layers**. If they drift, the first patch silently rewrites the artifact.

```bash
node -e '
const fs = require("fs");
const grab = (f, id) => fs.readFileSync(f, "utf8")
  .match(new RegExp("<script[^>]*id=\"" + id + "\"[^>]*>([\\s\\S]*?)</script>"))[1];
const J = (s) => JSON.stringify(JSON.parse(s));
const seam = { schema: J(grab("plan.html", "rules-schema")),
               data:   J(grab("plan.html", "rules-data")) };
const seed = JSON.parse(grab("rules-editor.html", "seed"));
const ok = JSON.stringify(seed.schema) === seam.schema
        && JSON.stringify(seed.data)   === seam.data;
console.log(ok ? "✓ seed matches the seam on both layers" : "✕ seed differs from the seam — a patch would corrupt the artifact");
'
```

Also confirm the inline script passes `node --check` — a browser-only artifact has no test runner, and a syntax error is a blank page.

**After a contract change, regenerate the seed and nothing else.** The editor carries no field list, so the same file re-projects from the new contract. See `SKILL.md` → *Changing the contract*.

## Returning the edits

The editor's JSON goes back through the seam, never through the prose:

```bash
S=<this skill>/scripts/patch-region.ts

node $S diff    plan.html rules rules.json
node $S apply   plan.html rules rules.json
node $S extract plan.html rules   # assert read-back == what was written
```
