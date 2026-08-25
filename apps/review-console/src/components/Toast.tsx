import React from 'react';
import { useReviewQueue } from '../context/ReviewQueueContext';

export const Toast: React.FC = () => {
  const { toast, closeToast } = useReviewQueue();

  if (!toast) return null;

  return (
    <div 
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-inverse-surface text-inverse-on-surface px-4 py-3 rounded-lg shadow-[0_8px_24px_rgba(0,0,0,0.2)] border border-border-standard animate-[slideUp_0.2s_ease-out]"
      role="alert"
    >
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-success text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
          check_circle
        </span>
        <span className="font-body-md text-body-md font-medium">
          {toast.message}
        </span>
      </div>

      {toast.auditId && (
        <div className="flex items-center gap-1.5 pl-3 border-l border-outline-variant/40">
          <span className="font-label-caps text-xs text-outline tracking-wider">audit ID:</span>
          <span className="font-technical-data text-xs text-inverse-on-surface bg-surface/20 px-1.5 py-0.5 rounded">
            {toast.auditId}
          </span>
        </div>
      )}

      <button 
        onClick={closeToast}
        aria-label="Dismiss toast"
        className="ml-2 text-inverse-on-surface/60 hover:text-inverse-on-surface p-1 rounded transition-colors cursor-pointer"
      >
        <span className="material-symbols-outlined text-[16px]">close</span>
      </button>
    </div>
  );
};
