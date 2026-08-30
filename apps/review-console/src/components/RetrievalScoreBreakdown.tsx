import React, { useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { useReviewQueue } from '../context/ReviewQueueContext';

export interface ScoreBreakdownData {
  bm25Score: number;
  bm25Weight: number;
  semanticScore: number;
  semanticWeight: number;
  metadataScore: number;
  metadataWeight: number;
  rawEnsembleScore: number;
  calibratedScore: number;
  adjustmentReason?: string;
}

interface RetrievalScoreBreakdownProps {
  candidate?: any;
  breakdown?: ScoreBreakdownData;
  defaultExpanded?: boolean;
  className?: string;
}

export const RetrievalScoreBreakdown: React.FC<RetrievalScoreBreakdownProps> = ({
  candidate,
  breakdown,
  defaultExpanded = true,
  className = ''
}) => {
  const { isDarkMode } = useReviewQueue();
  const [isExpanded, setIsExpanded] = useState<boolean>(defaultExpanded);

  // Extract or set default scores
  const bm25Score = breakdown?.bm25Score ?? 0.75;
  const bm25Weight = breakdown?.bm25Weight ?? 0.30;
  const semanticScore = breakdown?.semanticScore ?? 0.88;
  const semanticWeight = breakdown?.semanticWeight ?? 0.50;
  const metadataScore = breakdown?.metadataScore ?? 0.95;
  const metadataWeight = breakdown?.metadataWeight ?? 0.20;

  // Weighted contributions
  const bm25Contrib = Number((bm25Score * bm25Weight).toFixed(3));
  const semanticContrib = Number((semanticScore * semanticWeight).toFixed(3));
  const metadataContrib = Number((metadataScore * metadataWeight).toFixed(3));

  const rawEnsembleScore = breakdown?.rawEnsembleScore ?? Number((bm25Contrib + semanticContrib + metadataContrib).toFixed(2));
  const calibratedScore = breakdown?.calibratedScore ?? Number((candidate?.score ?? 0.79).toFixed(2));
  const adjustmentReason = breakdown?.adjustmentReason || "Granularity penalty (-5%)";

  // Data for Recharts Horizontal Bar Chart
  const chartData = [
    {
      name: 'Score Sources',
      'BM25 Lexical (30%)': bm25Contrib,
      'Semantic Embedding (50%)': semanticContrib,
      'Metadata Boost (20%)': metadataContrib,
    }
  ];

  // Colors per stage
  const COLORS = {
    bm25: '#2563eb',     // Blue
    semantic: '#9333ea', // Purple
    metadata: '#16a34a'  // Green
  };

  return (
    <div 
      className={`rounded-lg border border-border-standard overflow-hidden transition-all ${
        isDarkMode ? 'bg-slate-900/90 text-slate-100' : 'bg-white text-gray-900 shadow-xs'
      } ${className}`}
    >
      {/* Collapsible Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full flex items-center justify-between px-3.5 py-2.5 cursor-pointer transition-colors text-left ${
          isDarkMode ? 'hover:bg-slate-800/80' : 'hover:bg-gray-50'
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-primary">
            analytics
          </span>
          <span className="font-bold text-xs uppercase tracking-wider text-primary">
            Multi-Stage Retrieval Score Breakdown
          </span>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-900 border border-purple-200 dark:bg-purple-950 dark:text-purple-200 dark:border-purple-800">
            {calibratedScore} Calibrated
          </span>
        </div>
        <div className="flex items-center gap-1 text-outline">
          <span className="text-[11px] font-mono font-medium">
            {isExpanded ? 'Hide Details' : 'Show Details'}
          </span>
          <span className="material-symbols-outlined text-[18px] transition-transform duration-200" style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
            expand_more
          </span>
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-3.5 space-y-4 text-xs border-t border-border-standard">
          
          {/* Stage Scores Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* BM25 */}
            <div className="p-2.5 rounded-md border border-blue-200 dark:border-blue-900/50 bg-blue-50/60 dark:bg-blue-950/30 flex flex-col">
              <div className="flex justify-between items-center text-[11px] font-bold text-blue-900 dark:text-blue-300">
                <span>BM25 LEXICAL</span>
                <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-blue-200/80 dark:bg-blue-800">30% wt</span>
              </div>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-base font-bold font-mono text-blue-700 dark:text-blue-400">{bm25Score}</span>
                <span className="text-[11px] text-outline font-mono">Contrib: +{bm25Contrib}</span>
              </div>
            </div>

            {/* Semantic */}
            <div className="p-2.5 rounded-md border border-purple-200 dark:border-purple-900/50 bg-purple-50/60 dark:bg-purple-950/30 flex flex-col">
              <div className="flex justify-between items-center text-[11px] font-bold text-purple-900 dark:text-purple-300">
                <span>SEMANTIC EMBEDDING</span>
                <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-purple-200/80 dark:bg-purple-800">50% wt</span>
              </div>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-base font-bold font-mono text-purple-700 dark:text-purple-400">{semanticScore}</span>
                <span className="text-[11px] text-outline font-mono">Contrib: +{semanticContrib}</span>
              </div>
            </div>

            {/* Metadata */}
            <div className="p-2.5 rounded-md border border-green-200 dark:border-green-900/50 bg-green-50/60 dark:bg-green-950/30 flex flex-col">
              <div className="flex justify-between items-center text-[11px] font-bold text-green-900 dark:text-green-300">
                <span>METADATA BOOST</span>
                <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-green-200/80 dark:bg-green-800">20% wt</span>
              </div>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-base font-bold font-mono text-green-700 dark:text-green-400">{metadataScore}</span>
                <span className="text-[11px] text-outline font-mono">Contrib: +{metadataContrib}</span>
              </div>
            </div>
          </div>

          {/* Recharts Stacked Horizontal Bar Chart */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-[11px] font-bold text-outline uppercase tracking-wider">
              <span>WEIGHTED CONTRIBUTION BREAKDOWN</span>
              <span className="font-mono font-bold text-primary">ENSEMBLE SUM = {rawEnsembleScore}</span>
            </div>
            <div className="h-14 w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={chartData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                  <XAxis type="number" domain={[0, 1]} hide />
                  <YAxis type="category" dataKey="name" hide />
                  <Tooltip 
                    formatter={(value: any, name: any) => [`${value} pts`, name]} 
                    contentStyle={{ 
                      backgroundColor: isDarkMode ? '#0f172a' : '#ffffff', 
                      borderColor: isDarkMode ? '#334155' : '#cbd5e1',
                      borderRadius: '6px',
                      fontSize: '11px'
                    }}
                  />
                  <Bar dataKey="BM25 Lexical (30%)" stackId="a" fill={COLORS.bm25} radius={[4, 0, 0, 4]} />
                  <Bar dataKey="Semantic Embedding (50%)" stackId="a" fill={COLORS.semantic} />
                  <Bar dataKey="Metadata Boost (20%)" stackId="a" fill={COLORS.metadata} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            {/* Custom Legend */}
            <div className="flex items-center justify-around text-[10px] font-medium text-outline pt-1">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs" style={{ backgroundColor: COLORS.bm25 }}></span>
                <span>BM25 ({bm25Weight * 100}%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs" style={{ backgroundColor: COLORS.semantic }}></span>
                <span>Semantic ({semanticWeight * 100}%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs" style={{ backgroundColor: COLORS.metadata }}></span>
                <span>Metadata ({metadataWeight * 100}%)</span>
              </div>
            </div>
          </div>

          {/* Calculation Formula Box */}
          <div className="p-2.5 rounded bg-surface-container border border-border-standard font-mono text-[11px] flex flex-col gap-1">
            <span className="text-[10px] font-sans font-bold text-outline uppercase tracking-wider">
              Calculation Formula:
            </span>
            <div className="text-on-surface font-semibold">
              ({bm25Score} × {bm25Weight}) + ({semanticScore} × {semanticWeight}) + ({metadataScore} × {metadataWeight}) = <span className="text-primary font-bold">{rawEnsembleScore}</span>
            </div>
          </div>

          {/* Before / After Calibration Box */}
          <div className="p-3 rounded-lg border border-purple-300 dark:border-purple-900 bg-purple-50/70 dark:bg-purple-950/40 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-bold text-purple-900 dark:text-purple-200 text-xs flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[15px]">tune</span>
                BEFORE / AFTER CALIBRATION
              </span>
              <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-purple-200 dark:bg-purple-800 text-purple-900 dark:text-purple-100 font-bold">
                Logistic Regression
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
              <div className="p-2 rounded bg-white/80 dark:bg-slate-900/80 border border-purple-200 dark:border-purple-900/60">
                <div className="text-[10px] text-outline uppercase font-semibold">RAW SCORE</div>
                <div className="font-mono text-sm font-bold text-on-surface-variant">{rawEnsembleScore}</div>
              </div>
              <div className="p-2 rounded bg-white/80 dark:bg-slate-900/80 border border-purple-300 dark:border-purple-800">
                <div className="text-[10px] text-purple-700 dark:text-purple-300 uppercase font-semibold">CALIBRATED SCORE</div>
                <div className="font-mono text-sm font-bold text-primary">{calibratedScore}</div>
              </div>
              <div className="col-span-2 sm:col-span-1 p-2 rounded bg-white/80 dark:bg-slate-900/80 border border-amber-200 dark:border-amber-900/60">
                <div className="text-[10px] text-amber-700 dark:text-amber-400 uppercase font-semibold">ADJUSTMENT REASON</div>
                <div className="text-[11px] font-medium text-amber-900 dark:text-amber-200 truncate" title={adjustmentReason}>
                  {adjustmentReason}
                </div>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};
