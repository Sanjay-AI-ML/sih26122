import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, X, ArrowRight } from 'lucide-react';

export interface GranularityWarningAlertProps {
  /** Warning message or flag indicating a coarse-grained match */
  granularity_warning?: string | null | boolean;
  /** Associated activity/record ID for navigation */
  activity_id?: string;
  /** Detailed reason explaining the coarse match */
  reason?: string;
  /** Calibrated confidence penalty message */
  confidence_penalty?: string;
  /** Callback when user clicks the dismiss button */
  onDismiss?: () => void;
  /** Custom callback for reviewing full details */
  onReviewDetails?: () => void;
  /** Renders prominent visual mode (e.g. on RecordDetailScreen) vs inline mode (ReviewQueueScreen) */
  isProminent?: boolean;
  /** Optional additional CSS classes */
  className?: string;
}

export const GranularityWarningAlert: React.FC<GranularityWarningAlertProps> = ({
  granularity_warning,
  activity_id,
  reason = 'This extraction matched report-level data (all spools) to individual items',
  confidence_penalty = 'Confidence reduced by 25%',
  onDismiss,
  onReviewDetails,
  isProminent = false,
  className = ''
}) => {
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const navigate = useNavigate();

  // If there's no warning or the user dismissed it, render nothing
  if (!granularity_warning || isDismissed) {
    return null;
  }

  const warningReason = typeof granularity_warning === 'string' && granularity_warning.trim().length > 0
    ? granularity_warning
    : reason;

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDismissed(true);
    if (onDismiss) {
      onDismiss();
    }
  };

  const handleReviewDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onReviewDetails) {
      onReviewDetails();
    } else if (activity_id) {
      navigate(`/record/${activity_id}`);
    }
  };

  if (isProminent) {
    return (
      <aside 
        aria-label="Granularity Warning"
        className={`w-full bg-amber-50 dark:bg-amber-950/50 border-2 border-amber-400/80 dark:border-amber-600/70 rounded-xl p-4 sm:p-5 shadow-md transition-all duration-300 ease-out animate-[fadeIn_0.3s_ease-in-out] ${className}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3.5">
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 shrink-0 mt-0.5 shadow-xs">
              <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6" aria-hidden="true" />
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-amber-900 dark:text-amber-100 text-sm sm:text-base flex items-center gap-1.5">
                  ⚠ Coarse Match Detected
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-200/80 dark:bg-amber-800/80 text-amber-900 dark:text-amber-100 border border-amber-300 dark:border-amber-700">
                  {confidence_penalty}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-amber-800/90 dark:text-amber-200/90 leading-relaxed font-normal">
                {warningReason}
              </p>
              <div className="flex items-center gap-3 pt-2">
                {activity_id && (
                  <button
                    type="button"
                    onClick={handleReviewDetails}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white shadow-xs transition-colors cursor-pointer"
                  >
                    <span>Review Full Details</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium text-amber-800 dark:text-amber-300 hover:bg-amber-200/60 dark:hover:bg-amber-900/40 transition-colors cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss warning"
            className="text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-100 hover:bg-amber-200/50 dark:hover:bg-amber-900/50 rounded-md p-1 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </aside>
    );
  }

  // Inline Mode (e.g. for ReviewQueueScreen list/table banner or row warning)
  return (
    <aside
      aria-label="Granularity Warning"
      className={`w-full bg-amber-50 dark:bg-amber-950/40 border border-amber-300/80 dark:border-amber-700/60 rounded-lg p-2.5 sm:p-3 shadow-xs transition-all duration-300 ease-out animate-[fadeIn_0.25s_ease-in-out] ${className}`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" aria-hidden="true" />
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <span className="font-semibold text-amber-900 dark:text-amber-100 text-xs sm:text-sm whitespace-nowrap">
              ⚠ Coarse Match Detected
            </span>
            <span className="hidden md:inline-block text-xs text-amber-800/80 dark:text-amber-300/80 truncate max-w-md">
              • {warningReason}
            </span>
            <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[11px] font-medium bg-amber-200/70 dark:bg-amber-800/60 text-amber-900 dark:text-amber-200">
              {confidence_penalty}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {activity_id && (
            <button
              type="button"
              onClick={handleReviewDetails}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold text-amber-800 dark:text-amber-200 hover:bg-amber-200/60 dark:hover:bg-amber-900/50 transition-colors cursor-pointer"
            >
              <span>Review Full Details</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss warning"
            className="text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-200 hover:bg-amber-200/50 dark:hover:bg-amber-900/50 rounded p-1 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default GranularityWarningAlert;
