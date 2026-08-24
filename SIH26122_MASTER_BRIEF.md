# SIH26122 Master Brief

### Intelligent Data Capture & Schedule-Linking Layer for Infrastructure Project Management

*Synthesized from 10 research sources (4 deep-research PDFs, 2 markdown reports, 2 additional analyst PDFs, 1 Elicit report, 1 Consensus.app academic CSV of ~94 papers) + independent live verification. Compiled 2026-08-22.*

---

## How to read this document

Every claim below carries a strength tag:

- **[STRONG]** — verified by an official government source (PIB/MoSPI/CAG/Parliament) or corroborated independently across ≥2 of the 10 source documents, or checked live against the web in this session.
- **[MEDIUM]** — from one credible source (a single research report, a vendor's own published claim, or a single peer-reviewed paper) — usable with attribution, not as a bare number.
- **[WEAK]** — appears only in AI-generated research output with no traceable citation, or is a number one AI tool derived by arithmetic from other numbers. Needs manual verification before it goes on a slide.
- **[REMOVE]** — contradicted by a live check in this session, or self-flagged as invented by the source document itself. Do not use.

Two independent live web searches were run during this synthesis to break ties between sources — both are cited inline where they resolved something.

---

## 1. Problem Summary (verified facts only)

Large Indian infrastructure projects (₹150 crore+, spanning civil, piping, static/rotating equipment, electrical, instrumentation, HSE) are planned in detail in Primavera P6 / MS Project down to L5/L6 activity level — but **actual progress on the ground is captured in daily reports, spreadsheets, site diaries, and verbal supervisor updates that are never structurally linked back to those L5/L6 activity IDs.** *[STRONG — this is the problem statement itself, and is independently corroborated by the fact that India's own central project-monitoring portal, PAIMANA, still relies on manual/API-fed structured updates and has no free-text ingestion layer, per MoSPI's own portal documentation.]*

**PAIMANA is real** and is the correct anchor for this problem. It is a MoSPI (Ministry of Statistics & Programme Implementation) web portal, launched **25 September 2025**, replacing the legacy **OCMS-2006** (Online Computerised Monitoring System), tracking Central Sector infrastructure projects worth ₹150 crore and above. *[STRONG — independently confirmed via live search against [PIB](https://www.pib.gov.in/PressReleasePage.aspx?PRID=2244898&reg=3&lang=1), [MoSPI's own portal](https://paimana-proj.mospi.gov.in/), and [drishtiias.com](https://www.drishtiias.com/state-pcs-current-affairs/paimana-portal-launched-by-mospi), in addition to being cited in 3 of the 4 research batches with PIB-dated references.]* One extraction batch initially flagged PAIMANA as possibly fabricated because of the future-sounding dates — this is now resolved: the dates are correct relative to today (22 Aug 2026), and the portal is real.

PAIMANA is explicitly integrated with DPIIT's Integrated Project Monitoring Portal (IPMP) via APIs, and a majority of projects are now updated automatically through that channel — **roughly 60–70%, the exact share varies month to month** (60% per Feb 2026 release, ~64% per one mid-2026 figure, 70%+ per Feb 2026 DPIIT-integration figure). *[MEDIUM — real and directionally consistent across sources, but don't quote a single precise percentage as fixed; frame it as "a majority."]* This confirms the core problem: **the remaining fraction of activity-level updates — precisely the free-text/spreadsheet/verbal-report lane this project targets — is not automated today.**

Multiple official audits independently confirm that fragmented/poor progress reporting correlates with real schedule and cost damage, though none of them isolate "bad data capture" as a standalone causal driver — that causal link is the project's own hypothesis, not a proven government finding:

- **CAG Report No. 19 of 2023** (24 Jul 2023): audited 66 Bharatmala Phase-I projects; 26,316 km awarded by 31 Mar 2023 had a sanctioned cost of ₹8,46,588 crore against a CCEA-approved ₹5,35,000 crore for 34,800 km. **[STRONG — official CAG report]**
- **CAG performance audit (2024, Madhya Pradesh bridges):** only 9 of 72 audited bridge works completed on time; the remaining 63 were delayed 1–68 months, with "inadequate planning" cited as a major reason. **[STRONG]**
- **Rajya Sabha / MoRTH answer, July 2024:** 697 National Highway projects (started since 1 Apr 2014) ran past their original completion schedule, citing land acquisition, statutory clearances, utility shifting, encroachment, contractor performance, and weather. **[STRONG — parliamentary record]**

**Do not claim** that poor field-data capture is *the* cause of these overruns — the audits cite land acquisition, clearances, contractor performance, and scope changes as the dominant named causes. The data-capture gap is this project's thesis about a contributing, currently-invisible factor, not an audited finding.

---

## 2. Scale of the Problem (STRONG/MEDIUM stats only)

### PAIMANA project counts over 2026 (a real, evolving time series — use dated snapshots, never blend them)

| Snapshot | Projects | Original cost | Revised cost | Cumulative expenditure |
| --- | --- | --- | --- | --- |
| Jan 2026 | 1,702 | ₹33.71 lakh cr | ₹39.25 lakh cr | ₹20.02 lakh cr |
| Apr 2026 | 1,981 | — | ₹42.78 lakh cr | — |
| May 2026 | 1,987 | ₹37.09 lakh cr | ₹42.50 lakh cr | ₹21.82 lakh cr |
| **Jun 2026 (latest, use this one)** | **1,847** | **₹35.62 lakh cr** | **₹40.54 lakh cr** | **₹21.97 lakh cr (54.18%)** |

**[STRONG]** — corroborated independently across 3 of 4 extraction batches with PIB citations, and the June 2026 row's arithmetic is internally consistent (₹40.54L − ₹35.62L ≈ ₹4.92L cr overrun). Use the June 2026 row as your single canonical snapshot in the deck; footnote it as "MoSPI/PAIMANA, June 2026."

**Note the anomaly and don't paper over it:** project count *drops* from 1,987 (May) to 1,847 (June), and revised cost also drops (₹42.50L → ₹40.54L cr). This is a real reporting artifact (likely projects exiting monitoring on completion, or a threshold/methodology recalibration) — not a contradiction between sources. It's listed under **Gaps (Section 5)** as something to research before presenting, since a jury member who's read the PAIMANA dashboard may ask about it.

**Cumulative cost overrun ≈ ₹4.92 lakh crore** (June 2026 snapshot). **[MEDIUM-STRONG]** — this specific rupee figure isn't stated verbatim in the PIB release text reviewed by one research batch, but it's arithmetically derivable from the release's own original/revised cost figures and is independently reported by financial media (NDTV Profit) citing MoSPI. Safe to use with a footnote; don't claim it's a headline PIB number.

Other snapshots in the overrun time series, useful only if you want to show a trend, not as the "current" number: ₹5.42L cr (Dec 2025), ₹5.65L cr (Apr 2026), ₹5.4L cr (May 2026). **[MEDIUM]**

**Delayed-project counts** — genuinely inconsistent across time and source, use only the specific dated figure you're citing:

- Oct 2023 (Rajya Sabha, via Fortune India): 1,788 projects; 837 delayed; 479 delayed ≥2 years; average delay among delayed projects **36.94 months**. **[STRONG — parliamentary answer]**
- Note: PAIMANA has, since around May 2025, stopped using an explicit "delayed" classification, reclassifying such projects as "ongoing" — flagged independently by one research batch as a transparency concern worth mentioning to a jury as a *reason your dataset is more valuable*, not as an accusation. **[MEDIUM — single-source claim, verify before citing]**

**Highway-specific delay stat:** an independent ratings-agency analysis of 129 highway projects (2021–2025, worth >₹1.40 lakh crore) found **65% still running more than 6 months behind schedule as of April 2026**, up from 55% in September 2024. **[MEDIUM — one named source ("ThePrint," citing an independent analysis), not a government figure — attribute clearly]**

### Sector breakdown (June 2026, PAIMANA) **[STRONG]**

- Transport & Logistics: 1,341 projects, ₹22.32 lakh cr (~55% of portfolio)
- Railways: 255 projects, ₹8.69 lakh cr
- Petroleum & Natural Gas: 105 projects, ₹4.33 lakh cr
- Power: 98 projects, ₹5.71 lakh cr

### Sector-specific overrun/delay depth **[MEDIUM — one source each, cross-check before using]**

- Railways: 36% cost overrun, 54% time overrun (Mar 2026 snapshot)
- Power: 18% cost overrun, 56% time overrun (Mar 2026 snapshot)

### Oil & Gas sector (most relevant to Oil India Limited, the likely problem owner) **[STRONG]**

- MoPNG year-end review (as of Oct 2024): 283 Oil & Gas CPSE projects ≥₹5 crore under implementation, anticipated cost ₹5.70 lakh crore; 89 major projects (>₹500cr) = ₹5.51 lakh crore. FY24-25 targeted expenditure ₹79,264 crore; actual through Oct 2024 was ₹37,138 crore (well under half, mid-year). **[STRONG — MoPNG official year-end review]**
- HPCL Rajasthan Refinery: Cabinet-approved cost revision from ₹43,129 crore to ₹79,459 crore (April 2026), an ~84% increase. **[STRONG — Cabinet approval is public record]** — note this is cited as evidence of the *scale of cost/schedule uncertainty in the sector*, not attributed to data-capture failure specifically.
- CAG (2025), Kochi Refinery polyol project: approved completion timeline of 50 months; final cost submission was delayed 27 months; ₹300.15 crore flagged as infructuous expenditure due to inadequate planning. **[STRONG — CAG audit]**

### Employment / workforce

- Construction is India's second-largest employer after agriculture. Its **share of total employment is 12.0%, down from 12.3% in the prior period**, per PLFS 2025. **[STRONG — official Periodic Labour Force Survey]**
- **PMI Construction Project Management Talent Gap Report 2026: India needs ~395,000 additional construction project management professionals by 2035.** **[STRONG — independently re-verified live via web search against PMI's own report and press coverage.]** **One research source cited "8.5 million by 2035" for India — this number is [REMOVE]. It does not appear in any PMI publication; the real India-specific figure is 395,000. (The 8.5M-adjacent figure that does exist — up to 30 million — is PMI's *global*, not India, projection; do not conflate the two.)**

### Figures to explicitly avoid using

- **"India's logistics cost is 14% of GDP vs 8–10% global benchmark"** — appeared in one research source. **[REMOVE / OUTDATED]** — independently re-verified live: the official **DPIIT–NCAER study (2024)** puts India's logistics cost at **7.97% of GDP for FY2023–24**, already comparable to the US (8.8%), Germany (8%), and Australia (8.6%). The older 13–14% figure has been explicitly superseded and was based on partial/external data, per the government's own framing of the new study. Do not use the old number in a 2026 deck.
- **"₹49,000–98,000 crore annual loss," derived from a McKinsey "10–20% of project value lost to delays globally" figure "conservatively applied" to India** — no Indian source verifies this; it's an AI-generated extrapolation. **[REMOVE]**
- **"RBI/NIPFP research: 1–1.5% annual GDP growth reduction from infra delays"** — sourced via a LinkedIn post, not a primary RBI/NIPFP publication. **[WEAK — do not cite without finding the actual paper]**
- **User-base headcounts** (e.g., "15,000–25,000 planning engineers," "50,000–75,000 site supervisors," "80,000–120,000 planners," "5–10 lakh supervisors," "1–1.5 lakh total professionals") — every one of these is a bottom-up guess by an AI tool. **Three of the four independent research batches explicitly warn against using any of these numbers and state that no authoritative national statistic exists for this population.** **[REMOVE — all variants]**. Use instead the jury-safe formulation two of the source reports independently converge on: *"The direct user base is not published as a single national statistic; the measurable proxy is 1,847 ongoing Central projects (PAIMANA, June 2026) and a construction workforce representing 12.0% of national employment (PLFS 2025). Precise headcount should come from the pilot itself (e.g., Oil India's own planner/supervisor count on the pilot project)."*
- **"Primavera P6's 2026 AI features deliver 31% fewer schedule overruns"** — appeared in one source with no citation. **[REMOVE]**

---

## 3. Existing Solutions and Their Gaps

### Government systems

| System | What it does | Gap for this problem |
| --- | --- | --- |
| **PAIMANA** (MoSPI, replaced OCMS-2006, launched Sep 2025) | Central dashboard for projects ≥₹150cr; ~60–70% auto-updated via DPIIT IPMP API | Portfolio/project level only — no L5/L6 activity capture, no free-text/voice ingestion. **This is the natural integration target, not a competitor.** |
| **PRAGATI** (PMO) | High-level review mechanism; 340+ projects reviewed, ₹17.05 lakh crore, since 2015 (as of June 2023 per Dec 2024 PIB release) **[STRONG]** | Reactive, monthly/periodic escalation tool — no daily activity-level event data |
| **PM Gati Shakti NPG** (DPIIT) | GIS-based planning/approval layer; evaluated 352 projects worth ₹16.10 lakh crore as of Feb 2026 **[STRONG]** | Planning-stage tool, not an execution-tracking system |
| **eOffice / CPSE PMIS** | Workflow/document repositories | Not a progress-capture layer |

### Enterprise scheduling systems

**Oracle Primavera P6 / P6 EPPM, MS Project, SAP PS** — the gold standard for holding the L5/L6 baseline plan, with real activity IDs, WBS structures, actual-date fields, approval workflows, and REST APIs (P6 EPPM exposes activity read/update endpoints). **Their shared, structural gap: they all assume progress has already been keyed in against the correct activity ID.** None of them parses a free-text sentence, a spreadsheet row in a contractor's own format, or a verbal update, and maps it to the right activity. **[STRONG — this is a structural fact about how these systems work, not a disputed claim]**

### Visual/reality-capture systems

**Doxel, OpenSpace, Buildots** — AI/computer-vision systems that compare 360° site imagery (cameras, drones, helmet-cams) against BIM/schedule to infer progress.

- **Doxel integrated with Oracle Primavera P6 EPPM on 16 August 2023** — this is a verifiable, dated, primary-source fact (Doxel's own announcement). **[STRONG]** **Do not claim "Doxel doesn't connect to Primavera" — it does, and a jury member may know this.** The correct differentiation is narrower and more defensible: Doxel's input is *visual*, requiring camera/drone/360° capture infrastructure, and it cannot observe things that aren't visible — concealed/buried/insulated work, hydrotest results, document approvals, permit status, verbal handoffs. It's also reported as **impractical or restricted in hazardous brownfield zones** (refineries, live oilfields, ATEX-classified areas) where camera deployment is safety-constrained — this specific claim about ATEX restrictions is **[MEDIUM]**, asserted across three research batches but not independently verified against a safety regulation in this session; verify before stating it as fact to a jury.
- **OpenSpace**: 360° capture, tracks 700+ visual work items across 200+ schedule tasks, integrates with P6/MS Project/Asta/Excel; its own materials describe the "visible = trackable" limitation directly. **[MEDIUM — vendor's own published claim]**
- **Buildots**: helmet-cam-based CV tracking, ~80 stages tracked. **One research batch explicitly flags that public information on its exact schedule-integration workflow was insufficient to verify in detail — validate directly (e.g., a product demo) before making a specific feature claim about it in the deck.**

### Predictive/optimization tools (downstream of this project, not competitors)

- **nPlan**: schedule-risk forecasting, trained on a claimed 750,000+ historical schedules / $2 trillion of spend (vendor's own claim). **[MEDIUM]** Needs *your* clean actuals data to forecast well — a natural downstream consumer of this project's output, not a competing capture layer.
- **ALICE Technologies**: generative scheduling/sequencing optimization — improves *what should happen next*, assuming structured data already exists; this project improves *what is known to have actually happened*.

### Indian construction-tech (SME/commercial-real-estate focused)

**Powerplay, Onsite, Highrise, SenseHawk, Zepth, Infra.Market's software arm** — Indian mobile daily-reporting and ERP-style tools. All require the field team to select/enter into an already-structured task list; none are independently verified (in the research gathered) to do cross-disciplinary semantic reconciliation of free text to a Primavera-style L5/L6 schedule at CPSE/mega-project scale. One source notes Onsite's own marketing materials describe client projects running across **WhatsApp, Excel, Tally, and paper registers** — useful as commercial evidence that the "messy input" problem is real and already being lived with by industry, independent of this project's own claims. **[MEDIUM]**
**Infra.Market's software arm**: two independent research batches explicitly could not verify a comparable product publicly — state this as "no directly comparable, publicly verifiable product identified; would need NDA/vendor validation," not as "they don't do this."

### The core, defensible gap claim

Three independent "lanes" of input exist in field execution: **(A) visual/physical** (Doxel/OpenSpace/Buildots — hardware-dependent), **(B) structured digital** (P6/MS Project/SAP PS — requires clean pre-entered data), and **(C) free-text/spreadsheet/verbal** (daily reports, WhatsApp messages, site diaries, supervisor speech). Every reviewed vendor addresses lane A or B. **No reviewed vendor addresses lane C at the L5/L6 activity-linking level.** **[MEDIUM-STRONG — this is a synthesis conclusion across all 10 sources, but the specific "70-80% of field data lives in lane C" percentage that appeared in one source is unsourced — use the *qualitative* three-lane framing, not that specific percentage.]**

**Jury-safe phrasing (recommended, converges across sources):** *"We don't replace Primavera, PAIMANA, or Doxel. We are the missing layer that makes their inputs trustworthy — the bridge between how the field actually talks and how the schedule is structured."* Avoid absolute claims like "no existing solution does this" — say "the specific combination of heterogeneous free-text ingestion + L5/L6-aware fuzzy-matching + auditable human review + institutional memory is not addressed by any single reviewed product."

---

## 4. Our Solution's Unique Value

Converging across all sources, the differentiation rests on a **combination** of features, not any single novel algorithm — be explicit about this with a jury, it's a strength (defensible, buildable in 30 hours) not a weakness:

1. **Input-agnostic, hardware-free**: ingests free text, spreadsheets, scanned diaries, and voice — no cameras, drones, or new hardware deployment, making it safe and practical in brownfield/ATEX-restricted refinery and oilfield zones where visual-capture tools may be impractical.
2. **Evidence-first, not black-box**: every extracted event retains its source sentence/row — a planner can always see *why* the system proposed a match.
3. **Engineering-aware hybrid matching, not "just fuzzy string matching"**: deterministic rules (line/tag numbers, discipline codes, date windows, contractor identity) run first as hard filters; semantic embedding similarity ranks only within that filtered candidate set. This is best framed as **"constrained entity resolution over a schedule graph,"** not naive fuzzy matching — this exact framing is recommended by one of the more rigorous sources as a way to preempt a predictable jury objection.
4. **Granularity-mismatch awareness**: one field report can legitimately map to multiple L6 nodes (e.g., "spool erected" could be fabrication, erection, or hydrotest — three separate activities). The system should detect and flag one-to-many ambiguity rather than force a false single match — flagged by multiple sources as a genuine differentiator versus naive matching demos.
5. **Human-governed write-back**: the AI never silently writes to the baseline schedule. Confidence-banded review (e.g., high-confidence auto-suggest, mid-confidence requires planner confirmation, low-confidence routes to a review queue) with a full audit trail (who accepted/rejected/corrected, when, from what source).
6. **Confidence + explainability**: calibrated score, top-3 alternative matches, plain-language explanation of why a match was proposed.
7. **Institutional memory**: the accumulated, discipline-tagged, evidence-linked dataset becomes a queryable record of real project execution — actual durations, recurring delay causes, discipline-wise productivity — usable for future project planning. Multiple sources independently flag this as **potentially the more valuable long-term asset than the live dashboard itself**, converting the tool from "progress-reporting software" into "an organizational execution-memory system."
8. **Sits above, doesn't replace, existing systems**: integrates with Primavera P6 EPPM's own REST API rather than requiring a rip-and-replace — explicitly reduces adoption friction versus asking a CPSE to abandon Primavera.

**Recommended one-line pitch (converges independently across two of the most rigorous sources):**
*"An auditable AI execution-data layer that converts fragmented field reports, spreadsheets, and supervisor updates into trusted L5/L6 schedule actuals."* Stronger jury framing: *"We don't replace Primavera. We make Primavera understand the field."*

---

## 5. Technical Architecture (best composite version across all sources)

### Pipeline (7 stages — this is the most consistent architecture across all sources, converged and consolidated)

1. **Ingest** — free-text daily report (.txt/.pdf), spreadsheet (.csv/.xlsx), and a typed or lightly-mocked voice/conversational input. *(Full production OCR/ASR is explicitly not required for a 30-hour prototype — every source agrees on this scope boundary.)*
2. **Extract** (LLM/NLP) — pull structured fields per report line: activity phrase, discipline, line/tag/equipment ID, location, start/finish date, quantity, unit, status, contractor, delay reason, and — critically — the **exact source sentence** (for auditability).
3. **Deterministic filter** — hard-match on line/tag numbers, discipline codes, date windows, contractor identity. Runs *first*, as a filter, not a scorer.
4. **Semantic match** — embedding similarity (sentence-transformer / SBERT-style model) ranks candidates *within* the deterministically-filtered set, not the whole schedule.
5. **Confidence & explanation** — a combined score (rule-match strength + semantic similarity + discipline/date/location compatibility, minus a granularity-mismatch penalty) with a top-3 alternate list and a plain-language rationale.
6. **Human review queue** — planner sees extracted event, source evidence, recommended match, confidence, and alternates; can accept/reject/correct. Nothing writes to the baseline without this step.
7. **Write-back + institutional memory** — prototype: simulated update to a CSV/JSON "schedule"; production: staged write via the P6 EPPM REST API (confirmed to expose activity read/update endpoints), never a silent overwrite of the approved baseline. All accepted/rejected/corrected events accumulate into a queryable, discipline-tagged historical dataset.

### Confidence bands (explicitly a *prototype policy choice*, not a statistically validated threshold — say so if asked)

- ≥0.90 → auto-suggested match
- 0.70–0.89 → requires planner confirmation
- <0.70 → ambiguous/unmatched, routed to review, **never silently dropped**

### Named tech-stack options across sources (pick one coherent stack, don't mix-and-match in the pitch)

- **Extraction/NLP**: spaCy NER + regex, or an LLM (Llama 3 8B / Mistral, few-shot prompted) — smaller open models are preferred for cost and for keeping NDA-style data off public APIs
- **Matching**: RapidFuzz (deterministic) + sentence-transformers / SBERT / all-MiniLM-L6-v2 (semantic)
- **Backend**: FastAPI, with `/ingest`, `/match`, `/review`, `/approve` endpoints; SQLite for the audit trail in a prototype
- **Frontend**: React (+ shadcn/ui)
- **At scale**: PostgreSQL + FAISS/Milvus/Weaviate/Pinecone for vector search, Celery/Redis or Kafka/RabbitMQ for async processing, Kubernetes for horizontal scaling

### Academic grounding (from the Consensus.app literature survey — treat each as [MEDIUM], single-paper evidence, useful for a "this is grounded in published research" slide, not as headline stats)

- NLP information-extraction from procedural construction documents: 95.83% precision / 90.45% recall / 89.33% time savings vs. manual (Ren & Zhang, 2022)
- Transformer model mapping schedule activities to standard building classification categories: F1 0.93 (Level 2) / 0.87 (Level 3) (Jung, Hockenmaier, Golparvar-Fard, 2024 — "UniformatBridge")
- NLP extraction of activities directly from contracts: ~94–95% precision/recall (Hassan & Le, 2022)
- Multi-source heterogeneous data fusion in industrial/chemical-engineering construction: 91%+ prediction accuracy, <200ms processing (Xin, 2025)
- Oil & gas-specific precedent: BIM + Earned Value Management for LNG progress tracking via a mobile actualization app (Alzraiee, 2018); piping-phase schedule impact shown to be disproportionately high relative to procurement/construction phases (Yi, Lee, Ahn, 2019)

**Honest scalability framing (every rigorous source agrees on this — use it, don't oversell):** 1 lakh users is a realistic engineering target (stateless APIs, async queues, cached embeddings, per-project indexing). **1 crore users is technically conceivable as a long-term national-platform vision but is not a credible near-term SIH claim** — at that scale, the constraint becomes human review-queue throughput and organizational rollout (procurement, training, multilingual support, data residency for sensitive CPSEs), not compute. State architectural scalability as an aspiration, not a proven operating scale.

### What NOT to build for the 30-hour prototype (converged, explicit scope boundary across sources)

Production-grade OCR or ASR; a full Primavera replacement; enterprise SSO; multi-region deployment; a BIM/3D engine; computer vision; a full predictive/forecasting model; a large-scale knowledge graph; production mobile apps; live write to a real, credentialed Primavera instance.

---

## 6. Business Model (most realistic version)

**There is no commercial SaaS pricing model in any of the 10 sources — every source, independently, frames this as a government/CPSE adoption problem, not a commercial one.** Do not invent a pricing tier structure; it isn't supported by the research and would look unearned to a jury evaluating a government-sponsored problem statement.

**Realistic, convergent adoption path:**

1. **Pilot**: Oil India Limited (the stated problem owner) — one project, a small number of disciplines (e.g., piping + civil), one baseline schedule export, one planner review team. Multiple sources independently converge on this exact framing as the credible first step — not "every construction company in India."
2. **Phase 2**: other Oil & Gas CPSEs — ONGC, IOCL, BPCL, HPCL, GAIL, EIL.
3. **Phase 3**: other infrastructure sectors — Railways, Roads/NHAI, Power, Ports, Water — each with their own PMIS/schedule conventions.
4. **Phase 4**: integration as a feeder module into PAIMANA itself (MoSPI/IPMD is repeatedly named as the "natural second adopter" — it already ingests structured updates from ministries and would benefit from a cleaner, activity-level heterogeneous-input pipeline).

**Policy alignment to cite (all real, verifiable programs):** National Infrastructure Pipeline, PM Gati Shakti, PAIMANA's own "one data, one entry" integration mandate with DPIIT's IPMP, PRAGATI, Digital India.

---

## 7. Key Talking Points for the Jury

1. **Anchor on one real, current, dated stat, not a blended average**: "As of June 2026, PAIMANA tracks 1,847 Central Sector infrastructure projects worth a revised ₹40.54 lakh crore across 17 ministries — and a majority, but not all, of those updates now flow automatically. The gap we close is the rest: the free-text, spreadsheet, and verbal updates that never reach the L5/L6 activity level."
2. **Pre-empt the "Doxel already does this" objection directly and correctly**: "Doxel connects to Primavera P6 with computer vision on visual site capture — that's a different, complementary lane. We handle what a camera can't see: buried piping, hydrotest results, verbal handoffs, permit approvals — and we need no new hardware, which matters in ATEX-restricted refinery zones."
3. **Pre-empt "isn't this just fuzzy matching?"**: "We run deterministic engineering identifiers — tag numbers, discipline codes, date windows — as a hard filter first, and only rank by semantic similarity within that filtered set. And critically, we detect when one field report legitimately maps to multiple schedule activities, and flag it for a human rather than forcing a false match."
4. **Be honest about scale**: "We're targeting 1 lakh users as a realistic engineering target. At national scale, the bottleneck becomes human review throughput and organizational rollout, not compute — we'd rather say that honestly than overclaim."
5. **Lead with governance, not automation**: "Nothing writes to the baseline schedule without a human approval and a full audit trail. That's not a limitation — for a CPSE managing NDA-sensitive execution data, that's the trust property that makes adoption possible."
6. **Close on institutional memory, not the dashboard**: "The bigger asset isn't the live dashboard — it's the growing, queryable record of what actually happened: real durations, real delay causes, real productivity by discipline and contractor. That's knowledge that today lives only in individual supervisors' heads and gets lost when a project closes."

---

## 8. Gaps — what this research does NOT answer

1. **No verified national headcount of the direct user base** (planning engineers, site supervisors, PMC staff). Every credible source in this research explicitly refuses to invent this number. You need this from Oil India directly, or you present without a headcount claim at all.
2. **The May→June 2026 PAIMANA anomaly is unexplained**: project count dropped from 1,987 to 1,847 and revised cost dropped from ₹42.50L to ₹40.54L crore in one month. This could be routine (project completions exiting monitoring) or a genuine methodology change — worth a direct look at the raw PAIMANA dashboard before presenting, in case a jury member has seen the same portal.
3. **No India-specific, government-sourced statistic exists isolating cost/schedule damage caused specifically by poor field-data capture** (as opposed to land acquisition, clearances, or contractor performance, which the audits do name). This project's core value proposition is a hypothesis about an invisible contributing factor, not a proven, quantified one — the deck should say so rather than imply an existing statistic backs it.
4. **Whether Doxel's stated visual-capture limitation is actually blocked by ATEX/hazardous-zone safety regulation, or merely inconvenient**, is asserted across three AI-generated sources but not verified against an actual safety standard or refinery operating policy in this session.
5. **No pricing or commercial model has been researched at all** — every source frames this purely as government/CPSE adoption. If the jury asks about a business model beyond phased government adoption, there is currently no research basis for an answer.

### 5 specific searches to close these gaps before presenting

1. `site:paimana-proj.mospi.gov.in OR site:pib.gov.in PAIMANA July 2026 August 2026 projects revised cost` — get the freshest official snapshot and check whether the May→June project-count drop persists or reverses, directly from the primary source.
2. `Oil India Limited daily progress report format piping civil discipline sample` — find out if OIL has published (or can informally share) an actual sample DPR format, since the entire prototype's realism depends on this.
3. `"ATEX" OR "hazardous area classification" refinery drone camera restriction India oil and gas site policy` — verify or drop the claim that visual-capture tools are restricted in refinery/oilfield zones.
4. `SenseHawk TaskMapper Primavera P6 schedule import features 2026` — one source flags SenseHawk as "the most significant competitor"; get a current, direct feature comparison rather than relying on secondhand AI summaries.
5. `P6 EPPM REST API activity read update endpoint documentation Oracle` — confirm exactly what a real integration would require technically, so the architecture slide doesn't overpromise on Primavera write-back.

---

*Cross-source contradiction log (for your own reference, not for the deck): PAIMANA's OCMS-era predecessor is named "OCMS-2006" in most sources and "CSPM" in one — OCMS-2006 is correct, independently confirmed live. The "PM talent gap by 2035" figure ranged from 395,000 to 8.5 million across sources — 395,000 (India-specific, PMI 2026 report) is correct; 8.5 million conflates with PMI's unrelated global 30-million figure. The "logistics cost % of GDP" figure ranged from 8–10% to 14% across sources — 7.97% (DPIIT-NCAER, 2024) is the current official figure; older 13–14% claims are explicitly superseded.*
