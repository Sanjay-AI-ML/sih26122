# Setu — SIH26122

**Intelligent Data Capture & Schedule-Linking Layer for Infrastructure Project Management**
Problem Statement: SIH26122 · Organization: Oil India Limited · Category: Software · Theme: Smart Automation

Setu is the planning-to-execution bridge: it ingests messy, discipline-wise field reports (free text, spreadsheets, scanned diaries, supervisor voice) and turns them into structured, auditable actual-progress data linked to the correct L5/L6 schedule activity — the layer Primavera/PAIMANA don't provide today.

Full architecture, feature scope, and per-member build briefs: **[Setu Masterplan](https://claude.ai/code/artifact/26ff253e-8cdb-4f40-af8e-a84586f04948)** — read this before touching code. This README is the short version.

---

## The problem, in one line

Baseline schedules are precise (Primavera, L5/L6). Actual progress arrives as free-text daily reports, spreadsheets, diaries, and verbal updates that are never structurally linked back to the plan — so reconciliation is slow, error-prone, and the knowledge of what really happened is lost when the project closes.

## What Setu does

1. **Ingests** heterogeneous inputs — free text, spreadsheets, scanned diaries, voice — and extracts structured activity events with the source evidence attached.
2. **Matches** each event to the correct L5/L6 schedule node using deterministic engineering identifiers first (tag numbers, discipline codes, dates), then semantic similarity — not naive fuzzy string matching.
3. **Flags** ambiguous or unmatched activities for a human instead of guessing.
4. **Writes back** to the schedule only after planner approval, with a full audit trail.
5. **Builds institutional memory** — a queryable record of real durations, delay causes, and discipline-wise productivity for future projects.

We don't replace Primavera, PAIMANA, or Doxel. We're the missing layer that makes their inputs trustworthy.

## Architecture

```
INGEST → EXTRACT → FILTER → MATCH → SCORE → REVIEW → WRITE-BACK
 (free text,      (LLM/NLP    (rules:    (semantic  (confidence  (planner    (staged update
  spreadsheet,     pulls       tag,       similarity  + top-3     accepts/     + audit trail
  scan, voice)     fields)     discipline, within      alternates  rejects/    + institutional
                                date)      filtered    + reason)   corrects)   memory)
                                           set)
```

## Repo structure

```
setu/
├─ shared/
│  ├─ schemas/          # extracted_event.json, l6_activity.json, match_result.json — the contract everyone builds against
│  └─ sample-data/       # synthetic DPRs, spreadsheets, L5/L6 schedule export
├─ services/
│  ├─ ingestion/         # Member A — POST /ingest
│  ├─ matching/          # Member B — POST /match
│  ├─ writeback/         # Member D — POST /approve, audit log
│  └─ analytics/         # Member D — variance + institutional memory
├─ apps/
│  ├─ review-console/     # Member C — planner UI
│  └─ time-agent/         # Member C — supervisor chat/voice UI
├─ infra/                # Member D — docker-compose, seed scripts, CI
└─ docs/                 # masterplan, demo script, diagrams
```

## Who owns what

| Member | Owns | Branch |
|---|---|---|
| A | Ingestion & extraction (multi-format parsing → structured events) | `feat/ingestion-extraction` |
| B | Matching & confidence engine (deterministic filter + semantic ranking) | `feat/matching-engine` |
| C | Time Agent + Review Console (both React apps) | `feat/time-agent-console` |
| D | Write-back, institutional memory, analytics, infra/CI | `feat/writeback-memory-dashboard` |

Full deliverables, dependencies, and copy-paste AI build briefs per member are in the [masterplan, §08–09](https://claude.ai/code/artifact/26ff253e-8cdb-4f40-af8e-a84586f04948).

## Getting started

```bash
git clone <repo-url>
cd sih26122
git checkout -b feat/<your-area>
```

1. Read `shared/schemas/` before writing any service code — every endpoint's input/output must validate against it.
2. If the service you depend on isn't built yet, build against the fixtures in `shared/sample-data/` and mock the response — don't block on another member.
3. Open small PRs (one endpoint, one component, one schema change) against `main`, not one giant branch at the end.
4. `docker-compose up` (once `infra/` lands) boots every service and app together for local testing.

## Branching & PRs

- `main` is always demoable — never commit to it directly.
- One PR = one meaningful chunk of work. Tag the relevant owner as reviewer if your PR touches their directory.
- Merge order: shared schemas → ingestion & writeback (parallel) → matching → frontends & write-back integration → add-ons.
- CI validates every PR against `shared/schemas/` before it's mergeable.

## Explicit scope boundary

Not building for this prototype: production-grade OCR/ASR, a full Primavera replacement, enterprise SSO, computer vision, a full forecasting model, a live write to a real credentialed Primavera instance. Say this out loud in the demo — it reads as engineering judgment, not a gap.

## Deadline

Idea submission: **20 September 2026**
