import React, { useState } from 'react';
import { useReviewQueue } from '../context/ReviewQueueContext';

export interface RAGTerm {
  term: string;
  aliases?: string[];
}

export interface RAGAbbreviation {
  short: string;
  full: string;
}

export interface RAGContext {
  discipline: string;
  disciplineIcon?: string;
  relevantTerms?: (string | RAGTerm)[];
  examples?: string[];
  abbreviations?: (RAGAbbreviation | string)[];
  statusTerms?: string[];
}

interface RAGContextPanelProps {
  ragContext?: RAGContext;
  discipline?: string;
  defaultExpanded?: boolean;
  className?: string;
}

export const RAGContextPanel: React.FC<RAGContextPanelProps> = ({
  ragContext,
  discipline = 'Piping',
  defaultExpanded = true,
  className = ''
}) => {
  const { isDarkMode, showToast } = useReviewQueue();
  const [isExpanded, setIsExpanded] = useState<boolean>(defaultExpanded);

  const activeDiscipline = ragContext?.discipline || discipline || 'Piping';

  // Discipline accent color map
  const getDisciplineBorderColor = (disc: string) => {
    const d = disc.toLowerCase();
    if (d.includes('piping')) return 'border-l-blue-600';
    if (d.includes('civil')) return 'border-l-amber-600';
    if (d.includes('electrical')) return 'border-l-yellow-500';
    if (d.includes('instrumentation')) return 'border-l-purple-600';
    if (d.includes('hse')) return 'border-l-red-600';
    return 'border-l-teal-600';
  };

  const getDisciplineIcon = (disc: string) => {
    const d = disc.toLowerCase();
    if (d.includes('piping')) return 'build';
    if (d.includes('civil')) return 'foundation';
    if (d.includes('electrical')) return 'bolt';
    if (d.includes('instrumentation')) return 'precision_manufacturing';
    if (d.includes('hse')) return 'health_and_safety';
    return 'engineering';
  };

  // Fallback rich domain terms if not supplied
  const relevantTerms = ragContext?.relevantTerms || [
    { term: "spool erection", aliases: ["spool erected", "line erection"] },
    { term: "hydrotest", aliases: ["hydrostatic test", "pressure test"] },
    { term: "valve alignment", aliases: ["valve seating", "flange torqueing"] }
  ];

  const examples = ragContext?.examples || [
    "24-inch XX spool erection completed",
    "pressure test successful at 150 bar"
  ];

  const abbreviations = ragContext?.abbreviations || [
    { short: "HSE", full: "Health, Safety, and Environment" },
    { short: "NDT", full: "Non-Destructive Testing" },
    { short: "WBS", full: "Work Breakdown Structure" }
  ];

  const statusTerms = ragContext?.statusTerms || [
    "'completed' indicates event_type: finish",
    "'ongoing' indicates event_type: progress",
    "'stoppage' indicates event_type: delay_stoppage"
  ];

  const handleCopy = (textToCopy: string, label: string) => {
    navigator.clipboard.writeText(textToCopy);
    showToast(`Copied "${label}" to clipboard`, undefined, 'info');
  };

  return (
    <div 
      className={`rounded-lg border border-border-standard overflow-hidden border-l-4 transition-all ${getDisciplineBorderColor(activeDiscipline)} ${
        isDarkMode ? 'bg-slate-900/90 text-slate-100' : 'bg-gray-50 text-gray-900 shadow-xs'
      } ${className}`}
    >
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full flex items-center justify-between px-3.5 py-2.5 cursor-pointer transition-colors text-left ${
          isDarkMode ? 'hover:bg-slate-800/80' : 'hover:bg-gray-100'
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-primary">
            psychology
          </span>
          <span className="font-bold text-xs uppercase tracking-wider text-primary">
            RAG Context: Engineering Terminology
          </span>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-200 uppercase">
            {activeDiscipline}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-outline">
          <span className="text-[11px] font-mono font-medium">
            {isExpanded ? 'Collapse' : 'Expand'}
          </span>
          <span className="material-symbols-outlined text-[18px] transition-transform duration-200" style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
            expand_more
          </span>
        </div>
      </button>

      {/* Collapsible Body */}
      {isExpanded && (
        <div className="px-3.5 pb-3.5 pt-1 space-y-3.5 text-xs max-h-[380px] overflow-y-auto custom-scrollbar border-t border-border-standard/50">
          
          {/* DETECTED DISCIPLINE */}
          <div className="flex items-center justify-between p-2 rounded bg-blue-50/70 dark:bg-slate-800/60 border border-blue-200/60 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-blue-700 dark:text-blue-400">
                {getDisciplineIcon(activeDiscipline)}
              </span>
              <span className="font-bold uppercase tracking-wide text-[11px] text-blue-900 dark:text-blue-200">
                DETECTED DISCIPLINE:
              </span>
            </div>
            <span className="font-mono font-bold text-xs text-blue-700 dark:text-blue-300 capitalize">
              "{activeDiscipline}"
            </span>
          </div>

          {/* RELEVANT TERMS */}
          <div>
            <div className="flex items-center gap-1.5 mb-1.5 text-outline text-[11px] font-bold uppercase tracking-wider">
              <span className="material-symbols-outlined text-[14px] text-amber-500">menu_book</span>
              RELEVANT TERMS
            </div>
            <div className="space-y-1">
              {relevantTerms.map((item, idx) => {
                const termStr = typeof item === 'string' ? item : item.term;
                const aliasesStr = typeof item === 'object' && item.aliases ? ` (also: ${item.aliases.join(', ')})` : '';
                const fullText = `${termStr}${aliasesStr}`;
                return (
                  <div key={idx} className="group flex items-center justify-between p-1.5 rounded hover:bg-surface-container transition-colors border border-transparent hover:border-border-standard">
                    <span className="font-medium text-[#1a237e] dark:text-sky-300">
                      • "{termStr}" <span className="text-outline font-normal text-[11px]">{aliasesStr}</span>
                    </span>
                    <button
                      onClick={() => handleCopy(fullText, termStr)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-outline hover:text-primary transition-opacity cursor-pointer"
                      title="Copy Term"
                    >
                      <span className="material-symbols-outlined text-[14px]">content_copy</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* EXAMPLES FROM DISCIPLINE */}
          <div>
            <div className="flex items-center gap-1.5 mb-1.5 text-outline text-[11px] font-bold uppercase tracking-wider">
              <span className="material-symbols-outlined text-[14px] text-teal-600">article</span>
              EXAMPLES FROM DISCIPLINE
            </div>
            <div className="space-y-1">
              {examples.map((ex, idx) => (
                <div key={idx} className="group flex items-center justify-between p-1.5 rounded bg-surface-container-lowest border border-border-standard">
                  <span className="italic text-on-surface-variant font-mono text-[11px]">
                    "{ex}"
                  </span>
                  <button
                    onClick={() => handleCopy(ex, ex)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-outline hover:text-primary transition-opacity cursor-pointer"
                    title="Copy Example"
                  >
                    <span className="material-symbols-outlined text-[14px]">content_copy</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* ABBREVIATIONS FOUND */}
          <div>
            <div className="flex items-center gap-1.5 mb-1.5 text-outline text-[11px] font-bold uppercase tracking-wider">
              <span className="material-symbols-outlined text-[14px] text-purple-600">abbr</span>
              ABBREVIATIONS FOUND
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {abbreviations.map((abbr, idx) => {
                const short = typeof abbr === 'object' ? abbr.short : abbr.split('=')[0]?.trim();
                const full = typeof abbr === 'object' ? abbr.full : abbr.split('=')[1]?.trim();
                const fullText = `${short} = ${full}`;
                return (
                  <div key={idx} className="group flex items-center justify-between p-1.5 rounded bg-purple-50/50 dark:bg-purple-950/30 border border-purple-200/60 dark:border-purple-900/50">
                    <span className="font-mono font-bold text-purple-900 dark:text-purple-300 text-[11px]">
                      {short} <span className="font-sans font-normal text-on-surface-variant text-[10px]">= {full}</span>
                    </span>
                    <button
                      onClick={() => handleCopy(fullText, short || fullText)}
                      className="opacity-0 group-hover:opacity-100 p-0.5 text-outline hover:text-primary transition-opacity cursor-pointer"
                      title="Copy Abbreviation"
                    >
                      <span className="material-symbols-outlined text-[13px]">content_copy</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* STATUS TERMS */}
          <div>
            <div className="flex items-center gap-1.5 mb-1.5 text-outline text-[11px] font-bold uppercase tracking-wider">
              <span className="material-symbols-outlined text-[14px] text-green-600">published_with_changes</span>
              STATUS TERMS
            </div>
            <div className="space-y-1">
              {statusTerms.map((st, idx) => (
                <div key={idx} className="flex items-center gap-1.5 p-1.5 rounded bg-green-50/60 dark:bg-green-950/30 border border-green-200/60 dark:border-green-900/50 text-[11px] font-medium text-green-900 dark:text-green-300">
                  <span className="material-symbols-outlined text-[13px] text-green-600">check_circle</span>
                  <span>{st}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  );
};
