import React, { useState } from 'react';
import { useReviewQueue } from '../context/ReviewQueueContext';

interface ScheduleTimelinePanelProps {
  plannedStart?: string;
  plannedFinish?: string;
  actualDate?: string;
  wbsPath?: string;
  temporalBoost?: number;
  defaultExpanded?: boolean;
  className?: string;
}

export const ScheduleTimelinePanel: React.FC<ScheduleTimelinePanelProps> = ({
  plannedStart = "2026-08-15",
  plannedFinish = "2026-08-30",
  actualDate = "2026-08-28",
  wbsPath = "PROJECT-ALPHA > PIPING > SUBSTATION-01 > L6-PIP-402",
  temporalBoost = 10,
  defaultExpanded = true,
  className = ''
}) => {
  const { isDarkMode } = useReviewQueue();
  const [isExpanded, setIsExpanded] = useState<boolean>(defaultExpanded);

  return (
    <div className={`rounded-lg border border-border-standard overflow-hidden transition-all ${
      isDarkMode ? 'bg-slate-900/90 text-slate-100' : 'bg-white text-gray-900 shadow-xs'
    } ${className}`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full flex items-center justify-between px-3.5 py-2.5 cursor-pointer transition-colors text-left ${
          isDarkMode ? 'hover:bg-slate-800/80' : 'hover:bg-gray-50'
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-teal-600">
            calendar_clock
          </span>
          <span className="font-bold text-xs uppercase tracking-wider text-teal-700 dark:text-teal-400">
            Schedule & WBS Timeline Alignment
          </span>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-900 border border-teal-200 dark:bg-teal-950 dark:text-teal-200 dark:border-teal-800">
            +{temporalBoost}% Boost
          </span>
        </div>
        <div className="flex items-center gap-1 text-outline">
          <span className="text-[11px] font-mono font-medium">
            {isExpanded ? 'Hide' : 'Show'}
          </span>
          <span className="material-symbols-outlined text-[18px] transition-transform duration-200" style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
            expand_more
          </span>
        </div>
      </button>

      {isExpanded && (
        <div className="p-3.5 space-y-3 text-xs border-t border-border-standard">
          {/* WBS Path Monospace Breadcrumb */}
          <div className="p-2 rounded bg-surface-container border border-border-standard font-mono text-[10px] text-primary truncate" title={wbsPath}>
            <span className="font-sans font-bold text-outline uppercase mr-1">WBS:</span>
            {wbsPath}
          </div>

          {/* Timeline Bar */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-2 rounded bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900">
              <div className="text-[10px] font-bold text-blue-900 dark:text-blue-300 uppercase">PLANNED START</div>
              <div className="font-mono text-xs font-bold text-blue-700 dark:text-blue-400 mt-0.5">{plannedStart}</div>
            </div>
            <div className="p-2 rounded bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900">
              <div className="text-[10px] font-bold text-purple-900 dark:text-purple-300 uppercase">ACTUAL EVENT</div>
              <div className="font-mono text-xs font-bold text-purple-700 dark:text-purple-400 mt-0.5">{actualDate}</div>
            </div>
            <div className="p-2 rounded bg-teal-50/70 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-900">
              <div className="text-[10px] font-bold text-teal-900 dark:text-teal-300 uppercase">PLANNED FINISH</div>
              <div className="font-mono text-xs font-bold text-teal-700 dark:text-teal-400 mt-0.5">{plannedFinish}</div>
            </div>
          </div>

          {/* Temporal Boost Badge */}
          <div className="flex items-center justify-between p-2 rounded bg-green-50/60 dark:bg-green-950/30 border border-green-200/60 dark:border-green-900/50 text-[11px]">
            <span className="font-semibold text-green-900 dark:text-green-300 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[15px] text-green-600">verified</span>
              Temporal Schedule Match: Validated within target window
            </span>
            <span className="font-mono font-bold text-green-700 dark:text-green-400">+{temporalBoost}% Boost</span>
          </div>
        </div>
      )}
    </div>
  );
};
