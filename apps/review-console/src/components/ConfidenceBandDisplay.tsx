import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, HelpCircle } from 'lucide-react';

export type ConfidenceBand = 'high' | 'medium' | 'low';

export interface ConfidenceBandProps {
  confidence_score?: number; // Score between 0 and 1 (or 0 and 100)
  confidence_band?: ConfidenceBand;
  showScore?: boolean;
  showExplanation?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
  * Helper to determine confidence band from a numerical score (0 - 1).
  */
export function deriveConfidenceBand(score?: number): ConfidenceBand {
  if (score === undefined || score === null) return 'medium';
  // Normalize if passed on 0-100 scale
  const normalized = score > 1 ? score / 100 : score;
  if (normalized > 0.85) return 'high';
  if (normalized >= 0.5) return 'medium';
  return 'low';
}

/**
  * Helper returning color styling classes for a confidence band.
  */
export function getConfidenceBandColor(band: ConfidenceBand): {
  bg: string;
  text: string;
  border: string;
  badgeClass: string;
  tooltipBg: string;
} {
  switch (band) {
    case 'high':
      return {
        bg: 'bg-success/15 dark:bg-success/20',
        text: 'text-success dark:text-emerald-400',
        border: 'border-success/30 dark:border-success/40',
        badgeClass: 'bg-success/15 text-success border-success/30 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800/50',
        tooltipBg: 'border-emerald-500/30'
      };
    case 'medium':
      return {
        bg: 'bg-warning/15 dark:bg-warning/20',
        text: 'text-warning dark:text-amber-400',
        border: 'border-warning/30 dark:border-warning/40',
        badgeClass: 'bg-warning/15 text-warning border-warning/30 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800/50',
        tooltipBg: 'border-amber-500/30'
      };
    case 'low':
      return {
        bg: 'bg-error/15 dark:bg-error/20',
        text: 'text-error dark:text-rose-400',
        border: 'border-error/30 dark:border-error/40',
        badgeClass: 'bg-error/15 text-error border-error/30 dark:bg-rose-950/50 dark:text-rose-400 dark:border-rose-800/50',
        tooltipBg: 'border-rose-500/30'
      };
  }
}

/**
  * Helper returning the icon component associated with a confidence band.
  */
export function getConfidenceBandIcon(band: ConfidenceBand): React.ComponentType<{ className?: string }> {
  switch (band) {
    case 'high':
      return CheckCircle2;
    case 'medium':
      return AlertTriangle;
    case 'low':
      return XCircle;
  }
}

/**
  * Returns calibration explanation text for tooltip hover.
  */
export function getCalibrationExplanation(band: ConfidenceBand, scoreFormatted: string): string {
  switch (band) {
    case 'high':
      return `Matching Engine Score (${scoreFormatted}): High confidence candidate match with direct tag/discipline alignment and schedule context overlap.`;
    case 'medium':
      return `Matching Engine Score (${scoreFormatted}): Moderate confidence match requiring planner verification before schedule write-back.`;
    case 'low':
      return `Matching Engine Score (${scoreFormatted}): Low confidence candidate with granularity or semantic ambiguity. Planner review strongly recommended.`;
  }
}

export const ConfidenceBandDisplay: React.FC<ConfidenceBandProps> = ({
  confidence_score,
  confidence_band,
  showScore = true,
  showExplanation = true,
  className = '',
  size = 'md'
}) => {
  // Normalize numerical score to 0 - 1
  let normalizedScore: number | undefined = undefined;
  if (confidence_score !== undefined && confidence_score !== null) {
    normalizedScore = confidence_score > 1 ? confidence_score / 100 : confidence_score;
  }

  const effectiveBand: ConfidenceBand = confidence_band || deriveConfidenceBand(normalizedScore);
  const colors = getConfidenceBandColor(effectiveBand);
  const IconComponent = getConfidenceBandIcon(effectiveBand);

  const formattedScore = normalizedScore !== undefined ? normalizedScore.toFixed(2) : '--';
  const explanation = getCalibrationExplanation(effectiveBand, `${formattedScore} confidence`);

  const bandLabel =
    effectiveBand === 'high'
      ? 'High Confidence'
      : effectiveBand === 'medium'
      ? 'Medium Confidence'
      : 'Low Confidence';

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-xs sm:text-sm',
    lg: 'text-sm sm:text-base'
  };

  return (
    <div
      className={`group relative inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${colors.badgeClass} ${className} transition-all duration-200`}
      data-theme-band={effectiveBand}
    >
      <IconComponent className={`${iconSizes[size]} shrink-0`} />

      <span className={`font-semibold ${textSizes[size]} whitespace-nowrap`}>
        {bandLabel}
      </span>

      {showScore && normalizedScore !== undefined && (
        <span className={`opacity-90 ${textSizes[size]} font-mono font-medium whitespace-nowrap`}>
          ({formattedScore} confidence)
        </span>
      )}

      {showExplanation && (
        <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex group-focus:flex flex-col items-center z-50 w-64 p-2.5 rounded-lg text-xs font-normal text-slate-100 bg-slate-900/95 dark:bg-slate-900/95 border border-slate-700 shadow-xl backdrop-blur-sm transition-opacity duration-200">
          <div className="flex items-center gap-1 font-semibold text-slate-200 mb-1 w-full border-b border-slate-800 pb-1">
            <HelpCircle className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span>Calibration Explanation</span>
          </div>
          <p className="leading-relaxed text-slate-300 text-[11px] text-left">
            {explanation}
          </p>
          {/* Tooltip arrow */}
          <div className="w-2 h-2 -mb-3 rotate-45 bg-slate-900 border-r border-b border-slate-700"></div>
        </div>
      )}
    </div>
  );
};

export default ConfidenceBandDisplay;
