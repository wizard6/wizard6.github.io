---
name: progressive-build
description: >-
  use this when starting a new app/project/feature or multi-step implementation
  — in order: (1) 简单架构设计 including 落地形式 gaps, (2) Walking Skeleton + Incremental
  with hard confirm gates, (3) Evolutionary Iterative for product growth; never
  ship the full thing in one go
---
# Progressive build (demo-first)

Ordered process for new projects and multi-step features. **Do the three parts in order.** Completeness is wrong until the user green-lights the current slice.

## The three parts (required order)

| Step | Name | Job |
| --- | --- | --- |
| **1** | **简单架构设计** (simple architecture) | Fill the gaps models do not decide — especially **落地形式** and thin technical bounds |
| **2** | **可运行竖切骨架 + 增量交付** (Walking Skeleton + Incremental) | Build and gate runnable slices |
| **3** | **演化式迭代** (Evolutionary Iterative) | Grow the product across iterations using feedback |

English aliases: (1) Simple architecture design → (2) Walking Skeleton + Incremental delivery → (3) Evolutionary Iterative development.

**Spiral is optional only** inside Step 3 when an iteration has large unknowns — not a default fourth step.

---

## Step 1 — 简单架构设计

Process models do **not** prescribe **落地形式**. Treat missing delivery form as a **mandatory gap**. Do not start Step 2 until this is filled (proposed default OK if the user says「开始」).

### 落地形式 gap checklist

| Gap | Decide |
| --- | --- |
| **Host** | User machine / assistant computer / Pages / Docker / other |
| **Runtime** | Static files / local server / container / desktop |
| **Entry** | Exact URL, path, or command to open the demo |
| **Repo / folder** | Where source lives this iteration |
| **Data locus** | Disk files / localStorage / remote / stubs only |
| **Stack bounds** | e.g. TS+HTML only — in / out |
| **Auth / network** | Localhost-only / LAN / public — prefer safest for demos |

### Skeleton-level architecture (keep it simple)

Only enough for the first end-to-end path:

- One sentence system shape (what talks to what)
- The single happy path for Slice 0
- What is **explicitly deferred**

Not a full design doc. No plugin matrix, sync protocol, or deep module tree until a later iteration needs them.

**Step 1 output (chat, short):** goal + filled 落地形式 + thin architecture + deferred list → wait for confirm (or「开始」= accept proposed defaults).

---

## Step 2 — 可运行竖切骨架 + 增量交付

### Walking Skeleton（可运行竖切骨架）

Slice 0: thin **end-to-end** path that **runs under the Step 1 落地形式** — UI → logic → storage (or stubs). Not empty modules. New end-to-end path → new skeleton; adding onto an already-walking path → skip straight to increments.

Cousins (vocabulary): Tracer bullet, vertical slice.

### Incremental（增量交付 / 逐步堆砌）

After skeleton (or baseline) is approved: **one capability per slice**; product stays runnable. Hard gate after every slice.

### Micro rules

1. One slice per work turn; stop when demoable
2. Vertical, not horizontal — no full scaffolding
3. Hard gate: show Entry / works / not yet; no next slice until confirm
4. Widget for next step (continue / tweak / stop / redirect / new iteration)
5. No invented product; mark samples as samples
6. Smallest files that still run

### Reporting after each slice

1. **Open (Entry)**
2. **落地形式** (Host + Runtime, one line)
3. **Works** (1–3)
4. **Not yet** (1–3)
5. **Propose next** + widget

---

## Step 3 — 演化式迭代

Macro growth: each iteration ships a more complete **runnable** system, then feedback chooses the next growth.

### One iteration

1. Intent (user’s words)
2. Revisit Step 1 if 落地形式 or thin architecture must change
3. Runnable outcome
4. Execute Step 2 (skeleton if needed, then increments)
5. Feedback gate
6. Evolve — next iteration only after the gate

### New iteration when

- Current intent’s increments are enough / user stops
- Goal changes
- New capability needs its own skeleton
- **落地形式 changes** (e.g. static → Docker) — usually new skeleton
- Large unknowns → optional **Spiral-style risk pass** for that iteration only, then still Step 2

### Cousins

Evolutionary delivery/prototyping; Agile cadence; MVP as naming only.

Do **not** fake one mega-iteration that builds the whole product. Plan only this iteration’s skeleton + next 2–4 increments; later iterations as one-line options, not scheduled work.

---

## Phase 0 board (before any coding)

Propose in this order:

1. **Goal**
2. **Step 1:** 落地形式 checklist + simple architecture + deferred
3. **Step 2 plan:** Slice 0 (skeleton or first increment) + next 2–4 increments
4. **Step 3 frame:** current iteration intent + optional later iteration one-liners
5. **Risk note** only if high unknowns (optional Spiral-style)

Then wait.「开始」→ implement **only** the first Step 2 slice under Step 1 defaults.

---

## When it applies

New project/app/site/tool; multi-chunk features; user-visible refactors;「帮我实现 / 做一个 / 从零开始」.

Skip: one-line fixes, pure Q&A, config toggles, or「一口气做完 / 不要分步」.

## Composition

- `code-changes`: this skill owns order, 落地形式, and gates; each coding pass = **current Step 2 slice only**.
- Routines: schedules/monitors — not this skill.

## Anti-patterns

- Skipping Step 1 (coding with Host/Runtime/Entry unspecified)
- Treating Steps 2–3 as if they already chose 落地形式
- Full architecture / horizontal scaffolding first
- Building Slice 2 while waiting on Slice 0
- Polish before behavior confirmed
- Waterfall big-bang or fake mega-iteration
- Default Spiral on low-risk work
- Mid-slice whole-roadmap redesign instead of gating

## Exit

Summarize what exists, deferred items, open risks, current 落地形式, optional next iteration — then wait.
