import React, { useState } from 'react';
import { Send, Tag, Settings, ChevronDown, ChevronUp, Loader, AlertCircle } from 'lucide-react';

interface Keyword {
  keyword: string;
  category: string;
  confidence: number;
  context?: string;
}

interface PrimaveraMatch {
  activity_id: string;
  activity_name: string;
  task_code: string;
  discipline: string;
  confidence_score: number;
  matched_keywords: string[];
  rationale: string;
}

interface ExtractorState {
  keywords: Keyword[];
  primaveraMatches: PrimaveraMatch[];
  isLoading: boolean;
  error: string | null;
}

export const ClaudeKeywordExtractor: React.FC = () => {
  const [fieldReport, setFieldReport] = useState('');
  const [state, setState] = useState<ExtractorState>({
    keywords: [],
    primaveraMatches: [],
    isLoading: false,
    error: null
  });
  const [expandedKeyword, setExpandedKeyword] = useState<string | null>(null);
  const [expandedMatch, setExpandedMatch] = useState<string | null>(null);

  const handleExtractAndMatch = async () => {
    if (!fieldReport.trim()) {
      setState(prev => ({ ...prev, error: 'Please enter a field report' }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch('http://localhost:8002/keywords/extract-and-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ field_report: fieldReport })
      });

      if (!response.ok) {
        throw new Error(`Backend error: ${response.statusText}`);
      }

      const data = await response.json();

      setState(prev => ({
        ...prev,
        keywords: data.keywords || [],
        primaveraMatches: data.primavera_matches || [],
        isLoading: false,
        error: data.success ? null : (data.error || 'Unknown error')
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Network error'
      }));
    }
  };

  const getCategoryColor = (category: string): string => {
    const colors: Record<string, string> = {
      EQUIPMENT: 'bg-blue-100 text-blue-800',
      ACTIVITY: 'bg-green-100 text-green-800',
      LOCATION: 'bg-purple-100 text-purple-800',
      CONTRACTOR: 'bg-orange-100 text-orange-800',
      STATUS: 'bg-red-100 text-red-800',
      QUANTITY: 'bg-yellow-100 text-yellow-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const getDisciplineIcon = (discipline: string): string => {
    const icons: Record<string, string> = {
      piping: '🔧',
      civil: '🏗',
      electrical: '⚡',
      instrumentation: '📊',
      hse: '⚠',
      unspecified: '❓'
    };
    return icons[discipline.toLowerCase()] || '❓';
  };

  return (
    <div className="w-full bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center">
            <Tag className="w-4 h-4" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">Claude AI Keyword Extractor</h2>
        </div>
        <p className="text-sm text-gray-600">Extract intelligent keywords from field reports and match to Primavera tasks</p>
      </div>

      {/* Input Section */}
      <div className="px-6 py-4 border-b border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-2">Field Report Text</label>
        <textarea
          value={fieldReport}
          onChange={(e) => setFieldReport(e.target.value)}
          placeholder="Paste your field report here... e.g., '24-inch XX spool erection completed at sector 4 by L&T Heavy Engineering. Testing scheduled for tomorrow.'"
          className="w-full h-24 bg-gray-50 border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
        />
        <button
          onClick={handleExtractAndMatch}
          disabled={state.isLoading || !fieldReport.trim()}
          className="mt-3 flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {state.isLoading ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              Extracting...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Extract & Match
            </>
          )}
        </button>
      </div>

      {/* Error Display */}
      {state.error && (
        <div className="px-6 py-3 bg-red-50 border-b border-red-200 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800">Error</p>
            <p className="text-sm text-red-700">{state.error}</p>
          </div>
        </div>
      )}

      {/* Keywords Section */}
      {state.keywords.length > 0 && (
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Extracted Keywords ({state.keywords.length})
          </h3>
          <div className="space-y-2">
            {state.keywords.map((kw, idx) => (
              <div key={idx} className="border border-gray-200 rounded-lg p-3">
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => setExpandedKeyword(expandedKeyword === kw.keyword ? null : kw.keyword)}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getCategoryColor(kw.category)}`}>
                      {kw.category}
                    </span>
                    <span className="font-medium text-gray-900">{kw.keyword}</span>
                    <div className="flex items-center gap-1">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${kw.confidence * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-600 font-medium">{(kw.confidence * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                  {expandedKeyword === kw.keyword ? (
                    <ChevronUp className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  )}
                </div>
                {expandedKeyword === kw.keyword && kw.context && (
                  <div className="mt-2 pt-2 border-t border-gray-100 text-xs text-gray-600 italic">
                    Context: {kw.context}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Primavera Matches Section */}
      {state.primaveraMatches.length > 0 && (
        <div className="px-6 py-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gradient-to-r from-green-500 to-emerald-500" />
            Primavera Task Matches ({state.primaveraMatches.length})
          </h3>
          <div className="space-y-3">
            {state.primaveraMatches.map((match, idx) => (
              <div key={idx} className="border border-emerald-200 bg-emerald-50 rounded-lg p-4">
                <div
                  className="flex items-start justify-between cursor-pointer"
                  onClick={() => setExpandedMatch(expandedMatch === match.activity_id ? null : match.activity_id)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">{getDisciplineIcon(match.discipline)}</span>
                      <span className="font-mono text-xs font-bold text-gray-600">{match.activity_id}</span>
                      {match.task_code && <span className="text-xs text-gray-500">({match.task_code})</span>}
                    </div>
                    <p className="text-sm font-medium text-gray-900">{match.activity_name}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center gap-1">
                        <div className="w-20 bg-gray-300 rounded-full h-2">
                          <div
                            className="bg-emerald-600 h-2 rounded-full transition-all"
                            style={{ width: `${match.confidence_score * 100}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-emerald-700">{(match.confidence_score * 100).toFixed(0)}%</span>
                      </div>
                      <span className="text-xs text-gray-600 capitalize">
                        {match.discipline}
                      </span>
                    </div>
                  </div>
                  {expandedMatch === match.activity_id ? (
                    <ChevronUp className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  )}
                </div>

                {expandedMatch === match.activity_id && (
                  <div className="mt-3 pt-3 border-t border-emerald-200 space-y-2">
                    <div>
                      <p className="text-xs font-semibold text-gray-600 mb-1">Matched Keywords:</p>
                      <div className="flex flex-wrap gap-1">
                        {match.matched_keywords.map((kw, i) => (
                          <span key={i} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-600 mb-1">Rationale:</p>
                      <p className="text-xs text-gray-700 italic">{match.rationale}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!state.isLoading && state.keywords.length === 0 && state.primaveraMatches.length === 0 && !state.error && (
        <div className="px-6 py-8 text-center text-gray-500">
          <p className="text-sm">Enter a field report and click "Extract & Match" to see keywords and Primavera task matches</p>
        </div>
      )}
    </div>
  );
};
