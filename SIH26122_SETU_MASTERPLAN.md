Setu Masterplan

SIH26122 · Oil India Limited · Software · Smart Automation

# Setu

Intelligent Data Capture & Schedule-Linking Layer for Infrastructure Project Management — the planning-to-execution bridge. A build-ready masterplan: architecture, feature scope, and a four-person parallel work split with independent, mergeable pull requests.

Deadline20 Sep 2026
Team size4
Repo modelMonorepo
Prototype scope2–3 input formats
StatusReady to build

[01 Pitch](#pitch)
[02 PS coverage](#coverage)
[03 Architecture](#architecture)
[04 Feature set](#features)
[05 Add-ons](#addons)
[06 Tech stack](#stack)
[07 Repo & contracts](#repo)
[08 Team split](#team)
[09 AI build briefs](#aiprompts)
[10 Git / PR workflow](#workflow)
[11 Build timeline](#timeline)
[12 Demo script](#demo)
[13 Scope boundary](#scope)

01

## The pitch

> We don't replace Primavera, PAIMANA, or Doxel. We are the missing layer that makes their inputs trustworthy — the bridge between how the field actually talks and how the schedule is structured.

As of June 2026, PAIMANA tracks 1,847 Central Sector projects worth a revised ₹40.54 lakh crore, and a majority now update automatically via the DPIIT IPMP API. **Setu** closes the gap that remains: the free-text daily reports, discipline spreadsheets, site diaries, and verbal supervisor updates that never reach the L5/L6 activity level, on any Primavera-based project — starting with Oil India Limited's piping and civil disciplines.

02

## Problem-statement coverage

Every clause of the "Expected Outcome / Solution" paragraph in SIH26122, mapped to the exact module that satisfies it. This table is the rubric a judge would use — keep it true as you build.

| PS requirement (verbatim intent) | Satisfied by | Owner |
| --- | --- | --- |
| Ingest heterogeneous discipline-wise inputs (free-text, spreadsheets, scanned diaries, Primavera/MS Project exports) | Multi-format /ingest pipeline: .txt/.pdf parser, .csv/.xlsx parser, scan-tab stub, .xer/.mpp/.csv schedule importer | Member A |
| LLM-based conversational / voice interface for supervisors, minimal friction, structured output | Time Agent — chat+voice UI with context memory across open/close events | Member C |
| Fuzzy-match and link activity descriptions to the correct L5/L6 node; handle terminology and granularity mismatches | Deterministic filter + SBERT semantic ranker + one-to-many granularity flag | Member B |
| Flag unmatched / new activities for planner review instead of silently dropping them | Review queue, "+ New activity" path, confidence-banded routing | Members B + C |
| Auto-update actual start/end dates in near real time, with confidence score and audit trail per entry | Write-back service (staged, human-approved) + immutable audit log | Member D |
| Structured, discipline-tagged actual-progress dataset for analytics, forecasting, and institutional memory | Discipline-tagged event store + variance/forecast dashboard + queryable history | Member D |
| Working prototype: 2–3 varied input formats, extraction, schedule-linking logic; OCR/ASR not required at production grade | Demo set: DPR text + discipline spreadsheet + typed/spoken Time Agent input, against a synthetic L5/L6 baseline | All 4 |

03

## System architecture

Seven stages, converged from every research source in the brief. Each stage is a clean service boundary, which is exactly what makes the four-way split possible without merge conflicts.

01 INGESTDPR text, spreadsheet, scan stub, voice/chatMember A
02 EXTRACTLLM/NLP pulls activity, discipline, tag ID, dates, source sentenceMember A
03 FILTERDeterministic hard-match: tag no., discipline code, date windowMember B
04 MATCHSemantic ranking (SBERT) within the filtered candidate setMember B
05 SCOREConfidence + top-3 alternates + plain-language rationaleMember B
06 REVIEWPlanner console — accept / reject / correct, evidence shownMember C
07 WRITE-BACKStaged update + audit trail + institutional memory storeMember D

Nothing in stage 7 writes to the baseline schedule without a human decision in stage 6. That governance property is the trust argument for a CPSE, not a limitation.

04

## Core feature set

### Constrained entity resolution core

Hard filters (line/tag numbers, discipline codes, date windows, contractor identity) run before semantic similarity ever ranks a candidate — not naive fuzzy string matching over the whole schedule.

### Granularity-mismatch detection core

"Spool erected" can legitimately mean fabrication, erection, or hydrotest. Setu detects one-to-many ambiguity and routes it to a human instead of forcing a false single match.

### Evidence-first matches core

Every proposed match keeps its source sentence or spreadsheet row attached, so a planner can always see why the system proposed it — never a black box.

### Confidence-banded write-back core

≥0.90 auto-suggests, 0.70–0.89 needs planner confirmation, <0.70 routes to review — explicit prototype policy, stated as such.

### Context-aware Time Agent core

Supervisors report closes, rarely opens. The agent remembers an activity opened on day N so a single "closed today" utterance on day N+3 fills both start and end.

### Full audit trail core

Who accepted/rejected/corrected each event, when, and from which source document or utterance — immutable, per-entry.

05

## Add-ons beyond the minimum ask

The PS asks for ingestion, extraction, and linking. These extend the prototype into the "institutional memory" and analytics half of the Expected Outcome paragraph — the part most teams will skip because it's harder to demo. Build the core first; add these as the schedule allows, in the order shown.

### Variance & risk dashboard add-on

Discipline-wise planned-vs-actual variance, updated as events are approved. The first consumer of the clean dataset the pipeline produces.

### Institutional memory search add-on

Queryable history: "what did piping erection actually take on the last 3 projects?" — durations and recurring delay causes by discipline and contractor.

### Delay-pattern forecasting stub add-on

Simple regression/heuristic over accumulated actuals to flag activities trending behind — explicitly framed as a downstream consumer (nPlan/ALICE-style), not a competing scheduler.

### Hindi-English code-mixed voice add-on

Time Agent understands and displays both the original code-mixed utterance and its English structuring — matches how OIL site supervisors actually speak.

### Offline queue for the Time Agent add-on

Refinery and oilfield zones have patchy connectivity; entries queue locally and sync when back online, with a visible queue indicator.

### Contractor performance view add-on

Historical actual-vs-planned duration per contractor, feeding the "data-driven contractor selection" economic-impact claim in the pitch.

**Sequencing rule** — add-ons must never block the four core PRs from merging. Each add-on lands as its own small PR against an already-merged core module (see §09), so a judge sees a working core system even if the last add-on is mid-review.

06

## Tech stack

| Layer | Choice | Why |
| --- | --- | --- |
| Extraction / NLP | spaCy NER + regex, or Llama 3 8B / Mistral few-shot | Small open models keep NDA-style OIL data off public APIs |
| Deterministic matching | RapidFuzz | Fast, explainable hard filters on tag/discipline/date |
| Semantic matching | sentence-transformers (all-MiniLM-L6-v2) | Cheap, local, good-enough recall within a pre-filtered set |
| Backend | FastAPI | /ingest /match /review /approve — 4 endpoints map cleanly to 4 owners |
| Prototype store | SQLite | Zero-ops audit trail and event store for a 30-hour build |
| Frontend | React + shadcn/ui | Review Console + Time Agent share one component system |
| At-scale path | PostgreSQL, FAISS/Milvus, Kafka/Redis, Kubernetes | Named explicitly as the production target, not built in the prototype |
| Schedule integration | Primavera P6 EPPM REST API (staged write) | Sits above P6, never replaces it — confirmed the API exposes activity read/update endpoints |

07

## Repository layout & shared contracts

One monorepo, four owned directories, and a single shared/ folder that all four people write to on hour 1 — this is what lets four PRs merge without blocking each other.

| setu/ ├─ shared/ │  ├─ schemas/          # Pydantic + TS types — extracted_event.json, l6_activity.json, match_result.json │  └─ sample-data/       # synthetic DPRs, spreadsheets, L5/L6 schedule export ├─ services/ │  ├─ ingestion/         # Member A — FastAPI /ingest │  ├─ matching/          # Member B — FastAPI /match, confidence engine │  ├─ writeback/         # Member D — FastAPI /approve, audit log, memory store │  └─ analytics/         # Member D — variance + forecast endpoints ├─ apps/ │  ├─ review-console/     # Member C — planner React app │  └─ time-agent/         # Member C — supervisor chat/voice React app ├─ infra/                # Member D — docker-compose, seed scripts, CI └─ docs/                 # this masterplan, demo script, architecture diagram |

**Hour-1 rule:** before anyone writes a line of service code, all four agree the shape of shared/schemas/extracted_event.json and match_result.json together and commit it in one small first PR. Every other PR codes against that contract, so ingestion and matching can be built in parallel against mocked fixtures instead of a live upstream service.

08

## Four-person work split

Each member owns a directory, a set of endpoints, and one pull request per meaningful chunk of work — never one shared branch. Dependencies are explicit so nobody blocks on someone else's unfinished code.

### Member A — Ingestion & Extraction

services/ingestion
feat/ingestion-extraction

#### Owns

- Stage 1–2 of the pipeline: file intake and structured extraction
- POST /ingest — accepts .txt/.pdf, .csv/.xlsx, and a scan-tab stub; returns a list of ExtractedEvent
- LLM/NLP extraction: activity phrase, discipline, tag/line ID, location, start/finish date, quantity, contractor, delay reason, and the exact source sentence

#### Deliverables

- Parsers for 3 formats against the synthetic sample data in shared/sample-data
- Few-shot extraction prompt (or spaCy NER pipeline) with unit tests on 10+ varied report lines
- Every output conforms to shared/schemas/extracted_event.json

#### Depends on

- Nothing except the hour-1 schema — can start immediately with mocked matching downstream

### Member B — Matching & Confidence Engine

services/matching
feat/matching-engine

#### Owns

- Stage 3–5: deterministic filter, semantic ranking, confidence scoring
- POST /match — takes an ExtractedEvent, returns top-3 candidate L5/L6 nodes with score and rationale
- Granularity-mismatch flag when one event legitimately maps to multiple nodes

#### Deliverables

- RapidFuzz hard filter on tag number / discipline code / date window
- SBERT similarity ranking within the filtered set only
- Combined confidence score with the 0.90 / 0.70 bands and a plain-language "why" string per match

#### Depends on

- extracted_event.json schema (hour 1) and the synthetic L5/L6 schedule export in shared/sample-data — can build against Member A's mocked fixtures before A's parser is done

### Member C — Time Agent & Review Console

apps/time-agent, apps/review-console
feat/time-agent-console

#### Owns

- Stage 6 and the supervisor-facing capture surface
- Time Agent: chat + voice input, context memory across open/close events, dual-language display, one-tap confirmation, offline queue indicator
- Review Console: evidence-linked match cards, confidence bands as visual pills, accept/reject/correct, "+ New activity" for unmatched events, discipline coverage rail

#### Deliverables

- Both React apps consuming /match and posting to /approve
- Every state (auto-suggested / needs confirmation / unmatched) reads at a glance via color + label, never color alone

#### Depends on

- match_result.json schema (hour 1) — builds against mocked matcher responses until Member B's service is live

### Member D — Write-back, Memory & Infra

services/writeback, services/analytics, infra
feat/writeback-memory-dashboard

#### Owns

- Stage 7: staged schedule write-back, audit trail, institutional-memory store
- POST /approve — records the planner decision, writes to the simulated schedule (CSV/JSON in the prototype; P6 EPPM REST stub for the pitch), appends to the audit log
- Analytics: discipline-wise variance dashboard, delay-pattern query, contractor performance view
- Repo infra: docker-compose to run all 4 services + 2 apps together, seed script for synthetic data, CI (lint + tests) so every PR is checked before merge

#### Deliverables

- Append-only audit log: who/what/when/source per event
- Variance dashboard reading from the write-back store
- docker-compose up boots the whole prototype for the jury demo machine

#### Depends on

- Owns the schema for its own store; consumes Member C's /approve calls, which can be mocked with a curl script until C's UI is wired up

09

## AI build briefs — one per member

Everyone on this team is technical and building with an AI coding agent (Claude Code, Cursor, Copilot) rather than hand-writing every line. So each member's job is to **direct** the agent, not just prompt once and walk away: paste the brief below into your agent inside the repo, review what it produces against the schema and acceptance criteria in [§08](#team), and iterate. The brief is intentionally self-contained — schema, endpoints, constraints, and the deliverable are all in the text, so the agent doesn't need this whole document as context.

**How to run this well:** commit the hour-1 shared schemas first (§07) before any of the four briefs below start — every prompt references files that must already exist. Treat the agent's first output as a draft: read it, run the tests it writes, and correct it rather than accepting it blind. You are the reviewer of your own module's pull request, even if an AI wrote most of it.

### Member A

services/ingestion · feat/ingestion-extractionCopy prompt

```
You are building the Ingestion & Extraction service for Setu, an SIH26122 prototype (Oil India Limited; PS: Intelligent Data Capture & Schedule-Linking Layer for Infrastructure Project Management). Work inside services/ingestion/ in this monorepo.

GOAL
A FastAPI service exposing POST /ingest that accepts a free-text daily progress report (.txt/.pdf), a discipline spreadsheet (.csv/.xlsx), or a typed/voice transcript, and returns a list of ExtractedEvent objects.

FIRST: define the schema
Write shared/schemas/extracted_event.json (Pydantic model + matching TypeScript type) with these fields:
- activity_phrase (str) e.g. "spool erected on Line 24-XX"
- discipline (enum: civil, piping, static_rotating, electrical, instrumentation, hse)
- tag_or_line_id (str, nullable)
- location (str, nullable)
- event_type (enum: start, finish, unspecified)
- event_date (ISO date)
- quantity (float, nullable), unit (str, nullable)
- contractor (str, nullable)
- delay_reason (str, nullable)
- source_document (str), source_excerpt (str) -- the exact original sentence/row, always populated, this is the audit trail
- input_format (enum: free_text, spreadsheet, scan, voice)

BUILD
1. A .txt/.pdf parser for free-text daily progress reports using an LLM few-shot prompt or spaCy NER+regex to pull the fields above from each report line.
2. A .csv/.xlsx parser for discipline spreadsheets -- map columns to the same schema; spreadsheets are more structured, so this path should be higher-precision than free text.
3. A stub for scanned-diary input: accept the file, return a placeholder ExtractedEvent with input_format=scan and a note that it needs manual review -- production OCR is explicitly out of scope for this prototype, do not attempt real OCR.
4. Create synthetic sample data under shared/sample-data/ (a realistic free-text DPR, a discipline spreadsheet, 10+ varied report lines) since no real Oil India data is available -- do not fabricate anything and present it as real OIL data.
5. Unit tests covering all three formats.

CONSTRAINTS
- No internet-dependent OCR/ASR services.
- Every output must validate against shared/schemas/extracted_event.json -- three other services depend on this contract, don't change it without flagging it to the team.
- Keep source_excerpt verbatim -- it's the auditability feature the jury will ask about.

DELIVERABLE
POST /ingest running locally, tests passing, and a README in services/ingestion/ with example input/output for each of the 3 formats.
```

### Member B

services/matching · feat/matching-engineCopy prompt

```
You are building the Matching & Confidence Engine for Setu, an SIH26122 prototype (Oil India Limited). Work inside services/matching/.

INPUT
ExtractedEvent objects -- read the schema at shared/schemas/extracted_event.json first, it already exists (built by another team member; if it doesn't exist yet, stub a reasonable version and flag it). Also create shared/sample-data/l5_l6_schedule.csv, a synthetic Primavera-style L5/L6 schedule export: columns activity_id, wbs_path (L1>L2>...>L6), activity_name, discipline, tag_or_line_id, planned_start, planned_finish, contractor -- about 40-60 rows spanning a realistic refinery/pipeline WBS across piping, civil, and electrical. Do not present this as real OIL data.

GOAL
Write shared/schemas/match_result.json, then POST /match: takes one ExtractedEvent, returns a MatchResult:
- extracted_event_id
- candidates: up to 3 of { activity_id, wbs_path, score (0-1), rationale (plain-language string) }
- confidence_band (enum: auto_suggest >=0.90, needs_confirmation 0.70-0.89, unmatched <0.70)
- granularity_flag (bool) -- true when the event plausibly maps to more than one distinct L6 activity (e.g. "spool erected" could be fabrication, erection, or hydrotest)

PIPELINE -- implement in this exact order, each stage narrows the candidate set for the next
1. Deterministic filter using RapidFuzz + rule matching on tag_or_line_id, discipline, and a date window around planned_start/planned_finish. This runs FIRST and produces the candidate set -- never semantically rank the whole schedule.
2. Semantic ranking with sentence-transformers (all-MiniLM-L6-v2), comparing activity_phrase to activity_name, only within the filtered candidate set from step 1.
3. Combine rule-match strength + semantic similarity + discipline/date compatibility into one score, apply a penalty when granularity_flag is true, and generate a one-sentence rationale per candidate, e.g. "matched on tag PIP-2410 within a 3-day window, 0.92 semantic similarity to 'Erect Line 24-XX'".

CONSTRAINTS
- Confidence bands are a prototype policy choice, not statistically validated -- say so in the README, don't overclaim precision to the jury.
- This service only proposes matches. It must never write to the schedule.

DELIVERABLE
POST /match running locally against the synthetic schedule, plus tests covering: a clean high-confidence match, a genuinely ambiguous one-to-many case (granularity_flag=true), and a clear miss that correctly routes to unmatched.
```

### Member C

apps/review-console + apps/time-agent · feat/time-agent-consoleCopy prompt

```
You are building two React apps for Setu, an SIH26122 prototype: the Review Console (planner-facing) and the Time Agent (supervisor-facing). Work inside apps/review-console/ and apps/time-agent/, using React + shadcn/ui.

CONTEXT
Both consume shared/schemas/extracted_event.json and shared/schemas/match_result.json -- read them first. If services/matching isn't live yet, build against a mock: create 6-8 static MatchResult fixtures covering all 3 confidence bands plus at least one granularity_flag=true case, and a small mock server or fixture loader so the UI is fully demoable standalone.

REVIEW CONSOLE (apps/review-console)
- A feed of pending events awaiting review. Each card shows: source_excerpt (the evidence), discipline, the top-3 candidate matches with score and rationale, and the confidence_band as a visual pill -- encode state with a label AND a color, never color alone.
- Accept / Reject / Correct actions per event. Correct opens a picker to choose a different L6 activity from the candidates or search the full schedule.
- A distinct "+ New activity" path for anything the matcher returned as unmatched -- nothing should be silently dropped.
- On Accept/Correct, POST to services/writeback's /approve endpoint (mock this with a stub until Member D's service is live -- coordinate the request shape with them).
- A discipline coverage rail with live counts per discipline (piping, civil, electrical, instrumentation, static_rotating, hse).

TIME AGENT (apps/time-agent)
- A chat-style conversational UI with a voice input option (Web Speech API, or a mocked transcript toggle for demo reliability -- production ASR is out of scope).
- Context memory: if a supervisor reported an activity opening on day N, and later reports it closing on day N+3, a single new utterance should fill both actual_start and actual_finish -- don't force the supervisor to restate the open.
- Show the original utterance and a structured English summary side by side before the supervisor confirms.
- One-tap confirm, then submit the resulting event through the same ingest -> match -> approve path as any other input source.
- A visible offline-queue indicator for submissions that can't reach the backend yet.

CONSTRAINTS
Every state (auto-suggested / needs confirmation / unmatched / queued offline) must be visually distinguishable without relying on color alone.

DELIVERABLE
Both apps running locally against real or mocked backends, demonstrating the full accept/reject/correct/new-activity flow in the Console and one end-to-end submission through the Time Agent.
```

### Member D

services/writeback + services/analytics + infra · feat/writeback-memory-dashboardCopy prompt

```
You are building the write-back service, institutional-memory/analytics layer, and repo infrastructure for Setu, an SIH26122 prototype (Oil India Limited). Work inside services/writeback/, services/analytics/, and infra/.

SERVICES/WRITEBACK
- POST /approve -- accepts a decision: { extracted_event_id, chosen_activity_id, decision (accept/reject/correct), decided_by, source }.
- On accept/correct: write actual_start/actual_finish to a simulated schedule store (a CSV/JSON file standing in for Primavera). Also stub a client shaped like the real Primavera P6 EPPM REST API (activity read/update endpoints) so the integration story is credible in the pitch -- but do NOT attempt to write to any real, credentialed Primavera instance.
- Every write appends an immutable audit-log entry: who decided, when, from which source document/utterance, and the confidence score at decision time. Never overwrite an existing audit entry -- append only.
- Accepted/rejected/corrected events accumulate into shared/sample-data/event_history -- this is what services/analytics reads from.

SERVICES/ANALYTICS
- A variance endpoint: discipline-wise planned-vs-actual deltas computed from event_history.
- An institutional-memory query endpoint: given a discipline (and optionally an activity type), return historical actual durations and any recorded delay_reason values -- this is the "what did piping erection actually take last time" feature from the pitch.
- A simple delay-trend heuristic (not a full forecasting model -- a moving average or rule-based flag is enough) that surfaces activities trending later than planned.

INFRA
- docker-compose.yml that boots all 4 services + 2 frontend apps together with one command, seeded from the synthetic sample data.
- GitHub Actions CI that runs schema validation against shared/schemas/ plus each service's own tests on every pull request -- this is what keeps the other three members' PRs safe to merge, set it up early.
- A seed script producing a believable demo state: a handful of pending events, at least one ambiguous granularity case, and one clean unmatched activity, so the review queue isn't empty when the jury looks at it.

CONSTRAINTS
Nothing in this service writes to any store without a prior decision recorded via /approve -- write-back is always staged behind human approval, never automatic.

DELIVERABLE
docker-compose up boots the whole prototype end to end, CI passing on every pull request, and the variance dashboard showing real numbers computed from the seeded event history.
```

10

## Git & pull-request workflow

### Branching

main is always demoable. Each member works on their own long-lived feature branch (feat/<area>) and opens small, frequent PRs from short-lived sub-branches off it — never commits straight to main.

### PR size

One PR = one endpoint, one component, or one schema change. A PR that touches another member's directory gets that member tagged as reviewer before merge.

### Merge order

1) shared schemas → 2) A & D's data-producing endpoints (parallel) → 3) B's matcher (consumes A) → 4) C's UIs (consumes B) & D's write-back (consumes C) → 5) add-ons.

### CI gate

Every PR runs schema validation against shared/schemas plus that service's own tests before it's mergeable — owned by Member D, set up on hour 1.

**Commit convention:** feat(ingestion): parse discipline spreadsheet rows — scope names match the four directories, so git log --oneline --graph reads as a clean history of who built what, useful evidence for the jury's "how did you divide work" question.

11

## Build timeline (36-hour hackathon clock)

HOUR 0–1Contract syncAll four agree schemas together, commit shared/schemas and shared/sample-data in one PR. Docker-compose skeleton stubbed by Member D.
HOUR 1–10Parallel core buildA builds ingestion against fixtures; B builds matching against A's fixtures; C builds both UIs against mocked /match responses; D builds write-back against mocked /approve calls and stands up CI.
HOUR 10–14First integrationA→B wired live. First end-to-end path: a real DPR sentence produces a real ranked match. Fix schema drift here, not later.
HOUR 14–20Second integrationB→C→D wired live. Planner can accept a match in the Console and see it land in the audit trail. Time Agent produces a real event through the same path.
HOUR 20–26Add-onsVariance dashboard, institutional-memory search, offline queue, code-mixed voice — in priority order, each its own PR, none blocking the core demo.
HOUR 26–32Hardening & synthetic dataWiden sample data to cover ambiguous granularity cases and one deliberately unmatched activity, so the review-queue and "+ New activity" path has something real to show.
HOUR 32–36Demo rehearsal & deckRun the full demo script twice on the presentation machine. Freeze main.

12

## Demo script & jury talking points

Straight from the master brief's jury-tested framing — use these verbatim, they pre-empt the three objections a jury is most likely to raise.

### Anchor stat

"As of June 2026, PAIMANA tracks 1,847 Central Sector projects worth a revised ₹40.54 lakh crore — and a majority, but not all, of those updates now flow automatically. The gap we close is the rest: the free-text, spreadsheet, and verbal updates that never reach the L5/L6 activity level."

### "Doesn't Doxel already do this?"

"Doxel connects to Primavera P6 with computer vision on visual site capture — a different, complementary lane. We handle what a camera can't see: buried piping, hydrotest results, verbal handoffs, permit approvals — with no new hardware, which matters in hazardous refinery zones."

### "Isn't this just fuzzy matching?"

"We run deterministic engineering identifiers — tag numbers, discipline codes, date windows — as a hard filter first, and only rank by semantic similarity within that filtered set. And we detect when one report legitimately maps to multiple activities, and flag it for a human instead of forcing a false match."

### Close on memory, not the dashboard

"The bigger asset isn't the live dashboard — it's the growing, queryable record of what actually happened: real durations, real delay causes, real productivity by discipline and contractor. Today that knowledge lives only in individual supervisors' heads and gets lost when a project closes."

**Live sequence:** (1) show a free-text DPR line and a spreadsheet row side by side → (2) extraction produces two structured events, source sentence visible → (3) matcher proposes a high-confidence match for one, and a genuinely ambiguous one-to-many case for the other → (4) planner resolves both in the Review Console → (5) audit trail and variance dashboard update live → (6) speak an update into the Time Agent, show it land in the same pipeline.

13

## Explicit scope boundary

State these out loud in the pitch — saying what you didn't build, and why, reads as engineering judgment, not as a gap.

**Not building for the prototype:** production-grade OCR or ASR, a full Primavera replacement, enterprise SSO, multi-region deployment, a BIM/3D engine, computer vision, a full predictive/forecasting model, a large-scale knowledge graph, production mobile apps, or a live write to a real credentialed Primavera instance. Scalability is stated as an architectural target (1 lakh users realistic; 1 crore is a long-term platform vision, not a near-term claim) — never as a proven operating scale.
  

Setu · SIH26122 masterplan
Compiled 2026-08-23 · synthesized from the 10-source master brief
