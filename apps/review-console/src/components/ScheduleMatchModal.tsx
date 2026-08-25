import React, { useState } from 'react';
import { useReviewQueue } from '../context/ReviewQueueContext';
// ScheduleCandidate imported via context

export const ScheduleMatchModal: React.FC = () => {
  const {
    isScheduleModalOpen,
    setIsScheduleModalOpen,
    activeScheduleItem,
    confirmScheduleMatch,
    setIsCreateActivityModalOpen,
    selectedCandidate,
    setSelectedCandidate,
    t
  } = useReviewQueue();

  const [searchFilter, setSearchFilter] = useState('');

  if (!isScheduleModalOpen || !activeScheduleItem) return null;

  const currentCandidates = activeScheduleItem.candidates || [];
  const currentSelected = selectedCandidate || currentCandidates[0];

  const filteredCandidates = currentCandidates.filter(c => 
    c.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
    c.id.toLowerCase().includes(searchFilter.toLowerCase()) ||
    c.discipline.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const handleConfirmAndSend = () => {
    if (currentSelected) {
      confirmScheduleMatch(activeScheduleItem.id, currentSelected);
      setIsScheduleModalOpen(false);
    }
  };

  const handleOpenCreateActivity = () => {
    setIsCreateActivityModalOpen(true);
  };

  return (
    <div className="fixed inset-0 bg-inverse-surface/40 z-50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-[fadeIn_0.2s_ease-out]">
      {/* Modal Container */}
      <div className="bg-surface w-full max-w-4xl max-h-[92vh] rounded-md shadow-xl border border-border-standard flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center px-3 sm:px-4 py-2 sm:py-2.5 border-b border-border-standard bg-surface-container-low">
          <div>
            <h2 className="font-h3 text-h3 text-primary font-bold">{t("scheduleMatch")}</h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant text-xs">Planner's {t('plannerDecisionModule')}</p>
          </div>
          <button 
            onClick={() => setIsScheduleModalOpen(false)}
            aria-label="Close modal"
            className="text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer p-1 rounded hover:bg-surface-container-high"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
          {/* Left Panel: Search & Results */}
          <div className="w-full lg:w-3/5 border-b lg:border-b-0 lg:border-r border-border-standard flex flex-col bg-surface overflow-hidden max-h-[40vh] lg:max-h-none">
            {/* Search Bar */}
            <div className="p-2 sm:p-3 border-b border-border-standard">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-outline text-[16px]">search</span>
                <input 
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full pl-8 pr-10 py-1.5 bg-surface border border-border-standard rounded font-body-sm text-body-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary placeholder-on-surface-variant transition-colors" 
                  placeholder={t("searchPlaceholder")} 
                  type="text"
                />
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <kbd className="font-technical-data text-[9px] bg-surface-container-high px-1 py-0.5 rounded border border-border-standard text-on-surface-variant hidden sm:inline-block">⌘K</kbd>
                </div>
              </div>
            </div>

            {/* Results List */}
            <div className="flex-1 overflow-y-auto p-2 sm:p-3 space-y-2 custom-scrollbar">
              {filteredCandidates.map((cand) => {
                const isSelected = currentSelected?.id === cand.id;

                return (
                  <div
                    key={cand.id}
                    onClick={() => setSelectedCandidate(cand)}
                    className={`p-2.5 rounded-md cursor-pointer relative transition-all ${
                      isSelected
                        ? 'border-2 border-primary bg-primary-fixed/20 shadow-xs'
                        : 'border border-border-standard bg-surface hover:bg-surface-container-low hover:shadow-xs'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute right-2.5 top-2.5 text-primary">
                        <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                          check_circle
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="font-technical-data text-technical-data text-on-surface bg-surface-container-high px-1.5 py-0.5 rounded border border-border-standard text-xs">
                        {cand.id}
                      </span>
                      <span className="font-label-caps text-label-caps text-on-surface bg-surface-container-high px-1.5 py-0.5 rounded border border-border-standard uppercase text-[9px]">
                        {cand.discipline}
                      </span>
                    </div>

                    <h4 className={`font-body-md text-body-md mb-1 pr-6 text-xs sm:text-sm ${isSelected ? 'font-semibold text-primary' : 'text-on-surface font-medium'}`}>
                      {cand.title}
                    </h4>

                    <div className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">account_tree</span>
                      <span className="text-[11px] truncate">{cand.wbsPath}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Panel: Selected Detail & Actions */}
          <div className="w-full lg:w-2/5 flex flex-col bg-surface-bright overflow-hidden">
            <div className="flex-1 overflow-y-auto p-2.5 sm:p-3.5 custom-scrollbar">
              <h3 className="font-label-caps text-label-caps text-on-surface-variant mb-2.5 tracking-wider uppercase border-b border-border-standard pb-1 text-[10px]">
                Selected Activity Details
              </h3>

              {currentSelected ? (
                <div className="space-y-2.5">
                  {/* Detail Block */}
                  <div>
                    <label className="font-label-caps text-label-caps text-outline block mb-0.5 text-[10px]">Schedule</label>
                    <div className="flex gap-2 text-xs">
                      <div className="flex-1">
                        <div className="text-on-surface-variant text-[11px]">Planned Start</div>
                        <div className="font-technical-data text-on-surface font-medium">{currentSelected.plannedStart}</div>
                      </div>
                      <div className="flex-1">
                        <div className="text-on-surface-variant text-[11px]">Planned Finish</div>
                        <div className="font-technical-data text-on-surface font-medium">{currentSelected.plannedFinish}</div>
                      </div>
                    </div>
                    <div className="mt-1 text-xs">
                      <div className="text-on-surface-variant text-[11px]">Duration</div>
                      <div className="font-medium text-on-surface">{currentSelected.durationDays} Days</div>
                    </div>
                  </div>

                  {/* Detail Block */}
                  <div>
                    <label className="font-label-caps text-label-caps text-outline block mb-0.5 text-[10px]">Responsibility</label>
                    <div className="font-body-sm text-body-sm text-on-surface text-xs">{currentSelected.responsibility}</div>
                  </div>

                  {/* Detail Block */}
                  <div>
                    <label className="font-label-caps text-label-caps text-outline block mb-0.5 text-[10px]">Resources Allocated</label>
                    <ul className="text-xs text-on-surface space-y-0.5">
                      {currentSelected.resources.map((res, i) => (
                        <li key={i} className="flex items-center gap-1.5">
                          <span className="w-1 h-1 bg-border-standard rounded-full"></span> 
                          {res}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Source Excerpt (Raw Data context) */}
                  <div className="bg-source-excerpt p-2 rounded border border-warning/30 mt-2">
                    <label className="font-label-caps text-label-caps text-tertiary block mb-0.5 flex items-center gap-1 text-[10px]">
                      <span className="material-symbols-outlined text-[12px]">description</span> Field Report Context
                    </label>
                    <p className="font-technical-data text-[11px] text-tertiary-container italic leading-relaxed">
                      "{activeScheduleItem.sourceText}"
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-on-surface-variant text-body-sm text-xs">Select an activity to view details.</p>
              )}
            </div>

            {/* Actions */}
            <div className="p-2 sm:p-3 border-t border-border-standard bg-surface flex flex-col gap-2">
              <button 
                onClick={handleConfirmAndSend}
                className="w-full bg-primary text-on-primary font-body-md text-body-md py-1.5 px-3 rounded hover:bg-primary-container transition-colors flex justify-center items-center gap-1.5 shadow-xs cursor-pointer text-xs sm:text-sm font-medium"
              >
                <span className="material-symbols-outlined text-[16px]">send</span> Confirm &amp; Send
              </button>
              <div className="flex gap-1.5">
                <button 
                  onClick={handleOpenCreateActivity}
                  className="flex-1 bg-transparent border border-outline text-on-surface font-body-sm text-body-sm py-1 px-2 rounded hover:bg-surface-container-high transition-colors cursor-pointer text-center text-xs"
                >
                  {t('createActivityTitle')}
                </button>
                <button 
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="flex-1 bg-transparent text-on-surface-variant font-body-sm text-body-sm py-1 px-2 rounded hover:bg-surface-container-high transition-colors cursor-pointer text-center text-xs"
                >
                  {t('cancel')}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Audit Panel (Bottom) */}
        <div className="bg-panel-accent border-t border-border-standard py-1.5 px-3 flex flex-col sm:flex-row justify-between items-start sm:items-center text-[10px] font-technical-data text-outline gap-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span>[{activeScheduleItem.eventId}] → [{currentSelected?.id || 'L6-PIP-4092'}]</span>
            <span className="text-success font-semibold flex items-center gap-0.5">
              <span className="material-symbols-outlined text-[11px]">done</span> ACCEPT
            </span>
          </div>
          <span className="text-[9px]">Audit: {new Date().toISOString().replace('T', ' ').slice(0, 19)} UTC</span>
        </div>
      </div>
    </div>
  );
};
