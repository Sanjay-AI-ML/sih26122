import type {
  ExtractedEvent,
  MatchResult,
  ApprovalRequest,
  AuditLogResponse,
  ScheduleActivity,
  IngestResponse,
  AnalyticsStats,
  SCurvePoint,
} from '../types/schema';

const INGESTION = import.meta.env.VITE_INGESTION_URL ?? 'http://127.0.0.1:8001';
const MATCHING = import.meta.env.VITE_MATCHING_URL ?? 'http://127.0.0.1:8002';
const WRITEBACK = import.meta.env.VITE_WRITEBACK_URL ?? 'http://127.0.0.1:8003';
const ANALYTICS = import.meta.env.VITE_ANALYTICS_URL ?? 'http://127.0.0.1:8004';

async function post<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`POST ${url} → ${res.status}: ${detail}`);
  }
  return res.json() as Promise<T>;
}

async function get<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`GET ${url} → ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ─── Ingestion Service (port 8001) ───────────────────────────────────────────

export function ingestText(text: string, source_document = 'field_report'): Promise<IngestResponse> {
  return post<IngestResponse>(`${INGESTION}/ingest/text`, { text, source_document });
}

export function ingestVoice(transcript: string, source_document = 'voice_input'): Promise<IngestResponse> {
  return post<IngestResponse>(`${INGESTION}/ingest/voice`, { transcript, source_document });
}

export async function ingestFile(file: File): Promise<IngestResponse> {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${INGESTION}/ingest/file`, { method: 'POST', body: form });
  if (!res.ok) throw new Error(`Ingest file → ${res.status}`);
  return res.json();
}

// ─── Matching Service (port 8002) ────────────────────────────────────────────

export function matchEvent(event: ExtractedEvent): Promise<MatchResult> {
  return post<MatchResult>(`${MATCHING}/match`, event);
}

export function createActivity(activity: ScheduleActivity): Promise<{ message: string; activity_id: string }> {
  return post(`${MATCHING}/schedule/activities`, activity);
}

// ─── Writeback Service (port 8003) ───────────────────────────────────────────

export function approve(req: ApprovalRequest): Promise<AuditLogResponse> {
  return post<AuditLogResponse>(`${WRITEBACK}/audit/approve`, req);
}

export function reject(req: ApprovalRequest): Promise<AuditLogResponse> {
  return post<AuditLogResponse>(`${WRITEBACK}/audit/reject`, req);
}

export function getHistory(limit = 50): Promise<AuditLogResponse[]> {
  return get<AuditLogResponse[]>(`${WRITEBACK}/audit/history?limit=${limit}`);
}

// ─── Analytics Service (port 8004) ───────────────────────────────────────────

export function getStats(): Promise<AnalyticsStats> {
  return get<AnalyticsStats>(`${ANALYTICS}/analytics/stats`);
}

export function getSCurve(): Promise<SCurvePoint[]> {
  return get<SCurvePoint[]>(`${ANALYTICS}/analytics/s-curve`);
}
