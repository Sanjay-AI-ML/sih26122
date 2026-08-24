/**
 * Shared TypeScript interface for ExtractedEvent in Setu (SIH26122).
 * Mirrors shared/schemas/extracted_event.json and extracted_event.py
 */

export type Discipline = 
  | 'civil' 
  | 'piping' 
  | 'static_rotating' 
  | 'electrical' 
  | 'instrumentation' 
  | 'hse';

export type EventType = 
  | 'start' 
  | 'finish' 
  | 'progress' 
  | 'unspecified';

export type InputFormat = 
  | 'free_text' 
  | 'spreadsheet' 
  | 'scan' 
  | 'voice';

export interface ExtractedEvent {
  activity_phrase: string;
  discipline: Discipline;
  tag_or_line_id?: string | null;
  location?: string | null;
  event_type: EventType;
  event_date: string; // ISO date format YYYY-MM-DD
  quantity?: number | null;
  unit?: string | null;
  contractor?: string | null;
  delay_reason?: string | null;
  source_document: string;
  source_excerpt: string;
  input_format: InputFormat;
  raw_confidence_hint?: number | null;
}
