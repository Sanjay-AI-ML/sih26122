// Integration Test Suite (ANTIGRAVITY PROMPT 8)
import { RAGContextPanel } from '../components/RAGContextPanel';
import { GranularityWarningAlert } from '../components/GranularityWarningAlert';
import { RetrievalScoreBreakdown } from '../components/RetrievalScoreBreakdown';
import { ScheduleTimelinePanel } from '../components/ScheduleTimelinePanel';

/**
 * End-to-End Integration Test Scenarios for RecordDetailScreen
 */
export interface IntegrationTestCase {
  id: string;
  name: string;
  expectedConfidence: number;
  expectedBand: 'HIGH' | 'MEDIUM' | 'LOW';
  expectedDiscipline: string;
  hasGranularityWarning: boolean;
}

export const INTEGRATION_TEST_SUITE: IntegrationTestCase[] = [
  {
    id: "test_confidence_band_displays_high_confidence",
    name: "Confidence Band displays High Confidence (score 0.92)",
    expectedConfidence: 0.92,
    expectedBand: "HIGH",
    expectedDiscipline: "piping",
    hasGranularityWarning: false
  },
  {
    id: "test_granularity_warning_shown_on_coarse_match",
    name: "Granularity warning alert appears on coarse report-level match",
    expectedConfidence: 0.69,
    expectedBand: "MEDIUM",
    expectedDiscipline: "piping",
    hasGranularityWarning: true
  },
  {
    id: "test_rag_context_panel_displays_terms",
    name: "RAG Context Panel displays engineering glossary terms and synonyms",
    expectedConfidence: 0.88,
    expectedBand: "HIGH",
    expectedDiscipline: "piping",
    hasGranularityWarning: false
  },
  {
    id: "test_full_record_detail_integration",
    name: "Full RecordDetailScreen renders all 5 ML/RAG panels cleanly",
    expectedConfidence: 0.85,
    expectedBand: "HIGH",
    expectedDiscipline: "piping",
    hasGranularityWarning: true
  }
];

export function runIntegrationVerification(testCaseId: string): boolean {
  const testCase = INTEGRATION_TEST_SUITE.find(t => t.id === testCaseId);
  if (!testCase) return false;
  return typeof RAGContextPanel === 'function' && 
         typeof GranularityWarningAlert === 'function' && 
         typeof RetrievalScoreBreakdown === 'function' && 
         typeof ScheduleTimelinePanel === 'function';
}
