// Real backend contract types — matches services/matching/schemas.py + shared/schemas/extracted_event.py

export type DisciplineEnum =
  | 'civil'
  | 'piping'
  | 'static_rotating'
  | 'electrical'
  | 'instrumentation'
  | 'hse';

export type EventTypeEnum = 'start' | 'finish' | 'progress' | 'unspecified';
export type InputFormatEnum = 'free_text' | 'spreadsheet' | 'scan' | 'voice';
export type ConfidenceBand = 'high' | 'medium' | 'low';

export interface ExtractedEvent {
  activity_phrase: string;
  discipline: DisciplineEnum;
  tag_or_line_id?: string;
  location?: string;
  event_type: EventTypeEnum;
  event_date: string; // ISO YYYY-MM-DD
  quantity?: number;
  unit?: string;
  contractor?: string;
  delay_reason?: string;
  source_document: string;
  source_excerpt: string;
  input_format: InputFormatEnum;
  raw_confidence_hint?: number; // 0.0–1.0
}

export interface Candidate {
  activity_id: string;
  activity_name: string;
  score: number;
  rationale: string;
}

export interface MatchResult {
  event: ExtractedEvent;
  top_activity_id?: string;
  candidates: Candidate[];
  confidence_score: number; // 0.0–1.0
  confidence_band: ConfidenceBand;
  is_ambiguous: boolean;
  ambiguity_reason?: string;
}

export interface ApprovalRequest {
  activity_id: string;
  discipline: string;
  event_date: string;
  quantity?: number;
  unit?: string;
  confidence_score: number;
  confidence_band: string;
  was_ambiguous: boolean;
  source_document: string;
  source_excerpt: string;
  approved_by: string;
}

export interface AuditLogResponse extends ApprovalRequest {
  id: number;
  status: 'approved' | 'rejected';
  approved_at: string | null;
}

export interface ScheduleActivity {
  activity_id: string;
  activity_name: string;
  discipline: DisciplineEnum;
  tag?: string;
  wbs_path?: string;
  planned_start?: string;
  planned_finish?: string;
}

export interface IngestResponse {
  events: ExtractedEvent[];
  source_document: string;
  input_format: InputFormatEnum;
  event_count: number;
}

export interface AnalyticsStats {
  total_events: number;
  ambiguous_events: number;
  auto_suggested: number;
  discipline_breakdown: Array<{ discipline: string; count: number }>;
  daily_trend: Array<{ event_date: string; count: number }>;
}

export interface SCurvePoint {
  event_date: string;
  discipline: string;
  daily_quantity: number;
}

/**
 * Synthesizes a stable client-side ID for a given event.
 * Never sent to the server. Used only as a React key / dedup handle.
 */
export function makeClientEventId(event: ExtractedEvent): string {
  const raw = `${event.source_document}|${event.source_excerpt}|${event.event_date}`;
  // Simple djb2 hash — fast, no crypto needed, deterministic
  let hash = 5381;
  for (let i = 0; i < raw.length; i++) {
    hash = (hash * 33) ^ raw.charCodeAt(i);
  }
  return `cid_${(hash >>> 0).toString(16)}`;
}
