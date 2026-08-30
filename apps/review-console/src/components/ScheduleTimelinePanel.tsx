import React, { useMemo } from 'react';
import { Calendar, Zap, ExternalLink, Clock, Layers, ArrowRight } from 'lucide-react';
import type { ScheduleCandidate } from '../types';

export interface ScheduleActivity {
  id: string;
  title: string;
  plannedStart: string;
  plannedFinish: string;
  wbsPath?: string;
  discipline?: string;
}

export interface ScheduleTimelinePanelProps {
  activity?: ScheduleActivity | ScheduleCandidate;
  currentDate?: Date | string;
  temporalBoost?: number; // e.g. 0.15 for +15%
  projectTimelineStart?: string; // Default '2026-08-01'
  projectTimelineEnd?: string; // Default '2026-12-31'
  onOpenPrimavera?: () => void;
  className?: string;
}

interface ProjectPhase {
  name: string;
  start: string;
  finish: string;
  icon: string;
  color: string;
}

const DEFAULT_PHASES: ProjectPhase[] = [
  { name: 'Civil & Foundation Prep', start: '2026-08-01', finish: '2026-08-25', icon: 'foundation', color: 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30' },
  { name: 'Erection & Piping Phase', start: '2026-08-20', finish: '2026-10-15', icon: 'build', color: 'bg-sky-500/20 text-sky-600 dark:text-sky-400 border-sky-500/30' },
  { name: 'Electrical & Hydro Testing', start: '2026-10-10', finish: '2026-11-20', icon: 'power', color: 'bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/30' },
  { name: 'Commissioning & Handover', start: '2026-11-15', finish: '2026-12-31', icon: 'verified', color: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' }
];

export const ScheduleTimelinePanel: React.FC<ScheduleTimelinePanelProps> = ({
  activity,
  currentDate = new Date('2026-08-30'),
  temporalBoost = 0.15,
  projectTimelineStart = '2026-08-01',
  projectTimelineEnd = '2026-12-31',
  onOpenPrimavera,
  className = ''
}) => {
  const parseDate = (val: Date | string): number => {
    if (val instanceof Date) return val.getTime();
    return new Date(val).getTime();
  };

  const startMs = useMemo(() => parseDate(projectTimelineStart), [projectTimelineStart]);
  const endMs = useMemo(() => parseDate(projectTimelineEnd), [projectTimelineEnd]);
  const totalDurationMs = Math.max(1, endMs - startMs);

  const getPercentage = (dateVal: Date | string): number => {
    const timeMs = parseDate(dateVal);
    const clamped = Math.max(startMs, Math.min(endMs, timeMs));
    return ((clamped - startMs) / totalDurationMs) * 100;
  };

  const currDateObj = typeof currentDate === 'string' ? new Date(currentDate) : currentDate;
  const currPercent = getPercentage(currDateObj);
  const currFormatted = currDateObj.toISOString().split('T')[0];

  // Default activity fallback if not provided
  const activeActivity: ScheduleActivity = activity ? {
    id: activity.id,
    title: activity.title,
    plannedStart: activity.plannedStart || '2026-08-20',
    plannedFinish: activity.plannedFinish || '2026-09-05',
    wbsPath: (activity as ScheduleCandidate).wbsPath || '01.05.03 | Piping Main Header',
    discipline: activity.discipline
  } : {
    id: 'L6-PIP-4092',
    title: '24-inch spool erection & alignment',
    plannedStart: '2026-08-20',
    plannedFinish: '2026-09-05',
    wbsPath: '01.05.03 | Piping Main Header',
    discipline: 'Piping'
  };

  const actStartPercent = getPercentage(activeActivity.plannedStart);
  const actFinishPercent = getPercentage(activeActivity.plannedFinish);
  const actWidthPercent = Math.max(1.5, actFinishPercent - actStartPercent);

  // Normalize temporal boost to percentage (e.g. 0.15 -> 15%)
  const boostPercent = temporalBoost > 1 ? Math.round(temporalBoost) : Math.round(temporalBoost * 100);
  const boostOpacity = Math.min(1.0, Math.max(0.4, 0.4 + (boostPercent / 100) * 0.6));

  return (
    <div className={`bg-surface-container-lowest border border-border-standard rounded-lg p-3.5 sm:p-5 flex flex-col gap-4 text-on-surface shadow-xs transition-all ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-border-standard">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded bg-primary/10 text-primary">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-h3 text-sm sm:text-base font-semibold text-on-surface flex items-center gap-2">
              Temporal Context Timeline
              {boostPercent > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
                  +{boostPercent}% boost (active phase)
                </span>
              )}
            </h3>
            <p className="text-xs text-on-surface-variant font-technical-data flex items-center gap-1">
              Project Window: <span className="font-semibold text-on-surface">{projectTimelineStart}</span>
              <ArrowRight className="w-3 h-3 text-outline inline" />
              <span className="font-semibold text-on-surface">{projectTimelineEnd}</span>
            </p>
          </div>
        </div>

        {/* Primavera link action */}
        {onOpenPrimavera && (
          <button
            onClick={onOpenPrimavera}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 transition-colors cursor-pointer self-start sm:self-auto"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>View in Primavera P6</span>
          </button>
        )}
      </div>

      {/* Responsive Horizontal Scroll Container */}
      <div className="overflow-x-auto custom-scrollbar pb-2 pt-1">
        <div className="min-w-[620px] flex flex-col gap-6 relative select-none">
          {/* Phase Track */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider flex items-center gap-1">
              <Layers className="w-3 h-3" /> Project Schedule Phases
            </span>
            <div className="h-7 w-full bg-surface-container rounded-md relative flex items-center overflow-hidden border border-border-standard">
              {DEFAULT_PHASES.map((phase) => {
                const pStart = getPercentage(phase.start);
                const pFinish = getPercentage(phase.finish);
                const pWidth = Math.max(2, pFinish - pStart);

                return (
                  <div
                    key={phase.name}
                    className={`absolute top-0 bottom-0 flex items-center px-2 text-[10px] font-medium truncate border-r ${phase.color}`}
                    style={{ left: `${pStart}%`, width: `${pWidth}%` }}
                    title={`${phase.name}: ${phase.start} to ${phase.finish}`}
                  >
                    <span className="truncate">{phase.name}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Activity Timeline Bar & Current Date Marker */}
          <div className="relative pt-6 pb-2">
            {/* Today's Vertical Date Line Marker */}
            <div
              className="absolute top-0 bottom-0 z-20 flex flex-col items-center pointer-events-none"
              style={{ left: `${currPercent}%` }}
            >
              <div className="bg-rose-500 text-white font-mono text-[9.5px] px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap font-bold">
                Today ({currFormatted})
              </div>
              <div className="w-0.5 flex-1 bg-rose-500 shadow-sm"></div>
            </div>

            {/* Activity Track Container */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center text-xs text-on-surface-variant font-mono">
                <span>{projectTimelineStart}</span>
                <span>Current Status: Active Alignment Window</span>
                <span>{projectTimelineEnd}</span>
              </div>

              <div className="h-10 w-full bg-surface-container-high/60 rounded-lg relative border border-border-standard flex items-center">
                {/* Scheduled Activity Bar */}
                <div
                  className="group relative h-7 rounded-md bg-primary text-on-primary px-2.5 flex items-center justify-between shadow-xs transition-all duration-200 cursor-pointer"
                  style={{
                    left: `${actStartPercent}%`,
                    width: `${actWidthPercent}%`,
                    opacity: boostOpacity
                  }}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <Calendar className="w-3.5 h-3.5 shrink-0" />
                    <span className="text-xs font-semibold truncate">
                      {activeActivity.id}: {activeActivity.title}
                    </span>
                  </div>

                  {/* Hover Tooltip */}
                  <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 hidden group-hover:flex group-focus:flex flex-col z-30 w-72 p-3 rounded-lg bg-slate-900/95 text-slate-100 border border-slate-700 shadow-xl backdrop-blur-sm text-xs font-normal">
                    <div className="flex items-center justify-between border-b border-slate-700 pb-1.5 mb-1.5 font-semibold text-slate-200">
                      <span>{activeActivity.id}</span>
                      <span className="text-emerald-400 font-mono">+{boostPercent}% Boost</span>
                    </div>
                    <p className="font-medium text-slate-200 mb-1">{activeActivity.title}</p>
                    <p className="text-[11px] text-slate-400 font-technical-data mb-1">
                      Scheduled: {activeActivity.plannedStart} → {activeActivity.plannedFinish}
                    </p>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Temporal boost applies because the activity scheduled dates overlap with current project execution period.
                    </p>
                    <div className="w-2.5 h-2.5 -mb-4 rotate-45 bg-slate-900 border-r border-b border-slate-700 self-center"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer details */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs text-on-surface-variant pt-2 border-t border-border-standard gap-1">
        <span className="font-technical-data">
          Matched Activity: <strong className="text-on-surface">{activeActivity.id}</strong> ({activeActivity.plannedStart} to {activeActivity.plannedFinish})
        </span>
        <span className="text-emerald-600 dark:text-emerald-400 font-medium">
          Temporal Boost: +{boostPercent}% Score Calibration Applied
        </span>
      </div>
    </div>
  );
};

export default ScheduleTimelinePanel;
