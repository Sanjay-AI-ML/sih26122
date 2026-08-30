import React from 'react';

interface GranularityWarningAlertProps {
  warning?: string;
  className?: string;
}

export const GranularityWarningAlert: React.FC<GranularityWarningAlertProps> = ({
  warning = "coarse_match: Report-level terms detected ('all spools') matching multiple granular item nodes",
  className = ''
}) => {
  if (!warning) return null;

  return (
    <div className={`p-3 rounded-lg border border-amber-300 dark:border-amber-900/80 bg-amber-50/80 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 text-xs space-y-1.5 border-l-4 border-l-amber-500 shadow-2xs ${className}`}>
      <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-[11px] text-amber-900 dark:text-amber-300">
        <span className="material-symbols-outlined text-[16px] text-amber-600">warning</span>
        GRANULARITY MISMATCH WARNING (PHASE 6)
      </div>
      <p className="font-medium text-[11px]">
        {warning}
      </p>
      <div className="p-2 rounded bg-amber-100/70 dark:bg-amber-900/50 border border-amber-200 dark:border-amber-800 text-[10px] font-mono flex items-center justify-between">
        <span>Confidence Penalty Applied:</span>
        <span className="font-bold text-amber-800 dark:text-amber-300">-25% (Coarse Match)</span>
      </div>
    </div>
  );
};
