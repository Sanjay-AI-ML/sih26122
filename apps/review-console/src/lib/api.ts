// ============================================================
// Kadam Review Console — API Layer
// Wires to 4 Python microservices:
//   8001 → Ingestion  (/ingest/text)
//   8002 → Matching   (/match, /schedule/activities)
//   8003 → Writeback  (/audit/approve, /audit/reject, /audit/history)
//   8004 → Analytics  (/analytics/stats, /analytics/s-curve)
// ============================================================

const INGEST  = 'http://127.0.0.1:8001';
const MATCH   = 'http://127.0.0.1:8002';
const WRITE   = 'http://127.0.0.1:8003';
const ANALYT  = 'http://127.0.0.1:8004';

// ── Ingestion ────────────────────────────────────────────────
export interface IngestEvent {
  activity_phrase: string;
  discipline: string;
  tag_or_line_id: string | null;
  location: string | null;
  event_type: string;
  event_date: string;
  quantity: number | null;
  unit: string | null;
  contractor: string | null;
  delay_reason: string | null;
  source_document: string;
  source_excerpt: string;
  input_format: string;
  raw_confidence_hint: number | null;
}

export interface IngestResponse {
  success: boolean;
  total_events: number;
  source_document: string;
  input_format: string;
  events: IngestEvent[];
}

export async function ingestText(text: string, sourceDoc = 'review_console_manual'): Promise<IngestResponse> {
  const res = await fetch(`${INGEST}/ingest/text`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text,
      source_document: sourceDoc,
      default_date: new Date().toISOString().split('T')[0]
    })
  });
  if (!res.ok) throw new Error(`Ingestion failed: ${res.status}`);
  return res.json();
}

// ── Matching ─────────────────────────────────────────────────
export interface MatchCandidate {
  activity_id: string;
  activity_name: string;
  score: number;
  rationale: string;
}

export interface MatchResult {
  event: IngestEvent;
  top_activity_id: string | null;
  candidates: MatchCandidate[];
  confidence_score: number;
  confidence_band: 'high' | 'medium' | 'low';
  is_ambiguous: boolean;
  ambiguity_reason?: string;
  granularity_warning?: string | null;
}

export async function matchEvent(event: IngestEvent): Promise<MatchResult> {
  const res = await fetch(`${MATCH}/match`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(event)
  });
  if (!res.ok) throw new Error(`Matching failed: ${res.status}`);
  return res.json();
}

export async function addScheduleActivity(activity: {
  activity_id: string;
  activity_name: string;
  discipline: string;
  tag: string;
  wbs_path: string;
  planned_start: string;
  planned_finish: string;
}): Promise<void> {
  const res = await fetch(`${MATCH}/schedule/activities`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(activity)
  });
  if (!res.ok) throw new Error(`Add activity failed: ${res.status}`);
}

// ── Writeback ─────────────────────────────────────────────────
export interface ApprovalPayload {
  activity_id: string;
  discipline: string;
  event_date: string;
  quantity?: number | null;
  unit?: string | null;
  confidence_score: number;
  confidence_band: string;
  was_ambiguous: boolean;
  source_document: string;
  source_excerpt: string;
  approved_by: string;
}

export async function writebackApprove(payload: ApprovalPayload): Promise<void> {
  const res = await fetch(`${WRITE}/audit/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error(`Writeback approve failed: ${res.status}`);
}

export async function writebackReject(payload: ApprovalPayload): Promise<void> {
  const res = await fetch(`${WRITE}/audit/reject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error(`Writeback reject failed: ${res.status}`);
}

export async function getAuditHistory(): Promise<ApprovalPayload[]> {
  const res = await fetch(`${WRITE}/audit/history?limit=100`);
  if (!res.ok) throw new Error(`Audit history failed: ${res.status}`);
  return res.json();
}

// ── Analytics ─────────────────────────────────────────────────
export interface AnalyticsStats {
  total_events: number;
  approved: number;
  rejected: number;
  ambiguous: number;
  discipline_breakdown: Record<string, number>;
  daily_trend: { date: string; count: number }[];
}

export async function getAnalyticsStats(): Promise<AnalyticsStats> {
  const res = await fetch(`${ANALYT}/analytics/stats`);
  if (!res.ok) throw new Error(`Analytics stats failed: ${res.status}`);
  return res.json();
}

export async function getSCurve(): Promise<{ date: string; planned: number; actual: number }[]> {
  const res = await fetch(`${ANALYT}/analytics/s-curve`);
  if (!res.ok) throw new Error(`S-Curve failed: ${res.status}`);
  return res.json();
}
export async function getPendingQueue(): Promise<any[]> {
  const res = await fetch(`${WRITE}/queue/pending`);
  if (!res.ok) throw new Error(`Failed to fetch pending queue: ${res.status}`);
  return res.json();
}

export async function removeFromQueue(queueId: string): Promise<void> {
  const res = await fetch(`${WRITE}/queue/${queueId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`Failed to delete from queue: ${res.status}`);
}
