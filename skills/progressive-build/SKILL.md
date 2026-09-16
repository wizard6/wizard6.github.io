---
name: progressive-build
description: >-
  use this when building software that should be split into modules — for each
  module make a demo page and drive it to about 80% before starting the next;
  Step 1 simple architecture + 落地形式 + module map; Step 2 per-module demo
  gates; Step 3 Evolutionary Iterative; never finish the whole product in one go
---
# Progressive build (module demos to ~80%)

Break software into **modules**. For each module: ship a **demo page**, drive it to about **80%**, get user confirm, **then** start the next module. Do not finish the whole product in one pass.

**Do the three parts in order.**

| Step | Name | Job |
| --- | --- | --- |
| **1** | **简单架构设计** | 落地形式 + thin architecture + **module map** (order + demo Entry per module) |
| **2** | **按模块：演示页 → ~80%** | One module at a time; demo page first; stop near 80% and gate |
| **3** | **演化式迭代** | After a batch of modules (or on feedback), plan the next growth cycle |

English: (1) Simple architecture → (2) Per-module demo to ~80% → (3) Evolutionary Iterative.

Walking Skeleton / Incremental language still fits **inside** a module (thin path first, then thicken toward 80%). Spiral is optional only for high-risk cycles — not default.

---

## What this skill means (canonical)

User intent in one line:

> 做一个软件拆解成多个模块；给每个模块做好一个**演示页面**；做到大约 **80%** 之后再开发下一个。

Implications:

- **Unit of work = module**, not “the whole app” and not unbounded feature sprawl
- **Proof of work = demo page** the user can open (Entry URL/path)
- **Done-enough for handoff = ~80%** of that module’s agreed scope — usable/demoable; polish, rare edges, and nice-to-haves wait unless they block the demo
- **Hard gate** between modules: do not start module N+1 until the user accepts module N at ~80% (or explicitly says continue / cut scope)

---

## Step 1 — 简单架构设计

Process models do **not** prescribe **落地形式**. Fill gaps before coding.

### 落地形式 gap checklist

| Gap | Decide |
| --- | --- |
| **Host** | User machine / assistant computer / Pages / Docker / other |
| **Runtime** | Static / local server / container / desktop |
| **Entry root** | Base URL or folder for demos |
| **Repo / folder** | Where source lives |
| **Data locus** | Files / localStorage / remote / stubs |
| **Stack bounds** | e.g. TS+HTML only |
| **Auth / network** | Prefer localhost for demos |

### Module map (required)

List **ordered modules** for this iteration only (typically 3–7). For each:

- **Name** + one-line responsibility
- **Demo Entry** (path/URL for that module’s demo page)
- **~80% means** (3–5 concrete checks — what must work)
- **Out of scope for 80%** (explicit)

Also: one sentence system shape; what is deferred to later iterations.

**Step 1 output → wait for confirm** (or「开始」= accept proposed defaults + module order).

---

## Step 2 — Per-module demo to ~80%

For **one** module at a time:

1. **Demo page first** — smallest page that shows this module’s happy path (can stub neighbors)
2. **Thicken toward ~80%** — only this module’s agreed checks; keep the demo Entry working
3. **Stop at ~80%** — do not chase 100% polish; list remaining 20% as backlog for this module
4. **Hard gate** — report + widget; next module only after confirm

### Inside a module (micro)

- Start with a **Walking Skeleton** for that module (end-to-end on the demo page)
- Then **increments** until ~80% checks pass
- Vertical for this module; do not scaffold all other modules empty
- No invented product scope; mark sample data as samples
- Smallest files that still run

### ~80% definition

**~80%** = demo Entry works; agreed checks pass; user could judge the module; remaining work is polish/edges/non-blockers listed as **Not yet (≤20%)**.

If “80%” is unclear, redefine checks with the user before coding — do not silently inflate scope.

### Reporting after each module (and after major increments)

1. **Open (Entry)** — that module’s demo page
2. **落地形式** — Host + Runtime
3. **Module** — name
4. **Works (~80% checks)**
5. **Not yet (remaining ~20%)**
6. **Propose next** — next module / tweak this one / stop + widget

---

## Step 3 — 演化式迭代

Grow across cycles:

1. Intent
2. Revisit Step 1 if 落地形式 or module map must change
3. Run Step 2 module-by-module with gates
4. Feedback → next iteration (new modules, deepen a module past 80%, or change order)

**New iteration when:** goal changes; 落地形式 changes; module map is wrong; user wants to deepen a finished module toward 100%; high unknowns → optional Spiral-style risk pass then still Step 2.

Do not schedule the entire product’s modules as one executable batch — plan **this iteration’s module list** only.

---

## Phase 0 board (before coding)

1. Goal
2. Step 1: 落地形式 + simple architecture + **ordered module map** (demo Entry + 80% checks each)
3. Step 2: which module is first + its demo plan
4. Step 3: current iteration intent + optional later one-liners
5. Risk note only if needed

「开始」→ build **only** the first module’s demo toward ~80%, then gate.

---

## When it applies

New software / multi-module features /「做一个…」that should be split.

Skip: one-line fixes, pure Q&A, single-file tweaks, or「一口气做完」.

## Composition

- `code-changes`: pace by **current module**; one coding pass should not silently finish multiple modules
- Keep Pages/docs copies in sync when the user publishes this skill

## Anti-patterns

- Building module 2 while module 1 is unconfirmed
- “Demo page” that is only empty chrome for every module at once
- Chasing 100% on module 1 before any other module exists (unless user asks)
- Skipping 落地形式 / Entry
- Waterfall: design all modules fully, then implement all
- Treating Evolutionary Iterative as permission to ignore module gates

## Exit

Summarize modules at ~80%, remaining 20% lists, open risks, current 落地形式, next module or next iteration — then wait.
