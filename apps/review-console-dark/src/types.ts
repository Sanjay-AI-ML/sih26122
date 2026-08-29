export type StatusType = 'auto_approved' | 'review' | 'flagged' | 'in_progress' | 'pending' | 'completed' | 'delayed';

export type DisciplineType = 
  | 'Piping' 
  | 'Civil' 
  | 'Electrical' 
  | 'Instrumentation' 
  | 'Drilling' 
  | 'Production' 
  | 'Exploration'
  | 'Compliance'
  | 'Mechanical';

export type InputFormatType = 'dpr' | 'spreadsheet' | 'scan' | 'voice' | 'telemetry' | 'manual' | 'mobile';

export interface ScheduleCandidate {
  id: string; // e.g. L6-PIP-4092 or STR-4410-A
  wbsPath: string; // e.g. 01.05.03 | Piping Main Header | Numaligarh
  discipline: DisciplineType;
  title: string;
  plannedStart: string;
  plannedFinish: string;
  durationDays: number;
  responsibility: string;
  resources: string[];
  matchScore: number; // e.g. 0.78
  isRecommended?: boolean;
  rationale?: string;
}

export interface ExtractedField {
  fieldName: string;
  extractedValue: string;
  systemMapping: string;
  statusBadge?: string;
  hasWarning?: boolean;
  progressPercent?: number;
}

export interface QueueItem {
  id: string; // Internal/route ID
  eventId: string; // e.g. EV-8492A or OIL-2026-X882
  status: StatusType;
  statusLabel: string;
  activityPhrase: string;
  activityDescription: string;
  discipline: DisciplineType;
  inputFormat: InputFormatType;
  timestamp: string;
  date: string;
  confidenceScore: number; // 0 to 100
  delayReason?: string;
  tagId?: string;
  sourceText: string;
  formatTabs?: {
    dprText?: string;
    spreadsheet?: string;
    scanUrl?: string;
    voiceTranscription?: string;
  };
  extractedFields: ExtractedField[];
  candidates: ScheduleCandidate[];
  linkedActivity?: string;
  contractor?: string;
  exceptionNote?: string;
  actualStart?: string;
  actualFinish?: string;
  progress?: number;
  priority?: 'High' | 'Medium' | 'Low';
}

export interface NewReportInput {
  activityPhrase: string;
  discipline: DisciplineType;
  tagId: string;
  status: StatusType;
  actualStart: string;
  actualFinish: string;
  progress: number;
  contractor: string;
  exceptionNote: string;
}

export interface CreateActivityInput {
  wbsPath: string;
  activityName: string;
  level: 'L5' | 'L6';
  discipline: DisciplineType;
  plannedStart: string;
  plannedFinish: string;
  responsibleTeam: string;
  resources: string[];
  fieldReportContext: string;
  sourceId?: string;
}
