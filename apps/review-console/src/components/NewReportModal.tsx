import React, { useState } from 'react';
import { useReviewQueue } from '../context/ReviewQueueContext';
import type { DisciplineType, InputFormatType } from "../types";

export const NewReportModal: React.FC = () => {
  const { isNewReportModalOpen, setIsNewReportModalOpen, addNewReport, t } = useReviewQueue();

  const [activityPhrase, setActivityPhrase] = useState('');
  const [discipline, setDiscipline] = useState<DisciplineType>('Piping');
  const [tagId, setTagId] = useState('');
  const [contractor, setContractor] = useState('');
  const [progress, setProgress] = useState(50);
  const [actualStart, setActualStart] = useState(new Date().toISOString().split('T')[0]);
  const [actualFinish, _setActualFinish] = useState('');
  const [inputFormat, setInputFormat] = useState<InputFormatType>('dpr');
  const [exceptionNote, setExceptionNote] = useState('');

  if (!isNewReportModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activityPhrase.trim()) return;

    addNewReport({
      activityPhrase,
      discipline,
      tagId: tagId || 'TAG-NEW',
      contractor: contractor || 'Assam Field Engineers',
      progress,
      actualStart,
      actualFinish,
      status: 'review',
      exceptionNote
    });

    setIsNewReportModalOpen(false);
    // Reset form
    setActivityPhrase('');
    setTagId('');
    setProgress(50);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      <div 
        onClick={() => setIsNewReportModalOpen(false)}
        className="fixed inset-0 bg-on-surface/50 backdrop-blur-sm z-40 cursor-pointer"
      ></div>

      <div className="relative bg-surface rounded-md w-full max-w-[540px] shadow-xl border border-border-standard z-50 flex flex-col overflow-hidden animate-[fadeIn_0.2s_ease-out] max-h-[92vh]">
        <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 border-b border-border-standard bg-surface">
          <div>
            <h2 className="font-h2 text-h2 text-primary font-bold">{t('newReport')}</h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant text-xs">{t('queueSubtitle')}</p>
          </div>
          <button 
            onClick={() => setIsNewReportModalOpen(false)}
            className="text-on-surface-variant hover:text-on-surface p-1 rounded hover:bg-surface-container-low transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden min-h-0">
          <div className="p-3 sm:p-4 overflow-y-auto flex flex-col gap-3 custom-scrollbar">
            <div>
              <label className="block font-label-caps text-label-caps text-on-surface-variant mb-1 text-[10px]">
                ACTIVITY {t('descriptionCol')}
              </label>
              <textarea 
                value={activityPhrase}
                onChange={(e) => setActivityPhrase(e.target.value)}
                placeholder="e.g. Pump P-1102 alignment and grouting completed by evening shift. Area cleared."
                className="w-full p-2.5 bg-surface border border-border-standard rounded font-body-sm text-body-sm text-on-surface input-focus min-h-[70px]"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-label-caps text-label-caps text-on-surface-variant mb-1 text-[10px]">
                  DISCIPLINE
                </label>
                <select 
                  value={discipline}
                  onChange={(e) => setDiscipline(e.target.value as DisciplineType)}
                  className="w-full h-8 px-2.5 bg-surface border border-border-standard rounded font-body-sm text-body-sm text-on-surface input-focus text-xs"
                >
                  <option value="Piping">Piping</option>
                  <option value="Civil">Civil</option>
                  <option value="Electrical">Electrical</option>
                  <option value="Instrumentation">Instrumentation</option>
                  <option value="Drilling">Drilling</option>
                  <option value="Production">Production</option>
                  <option value="Exploration">Exploration</option>
                  <option value="Compliance">Compliance</option>
                </select>
              </div>

              <div>
                <label className="block font-label-caps text-label-caps text-on-surface-variant mb-1 text-[10px]">
                  TAG / ASSET ID
                </label>
                <input 
                  value={tagId}
                  onChange={(e) => setTagId(e.target.value)}
                  placeholder="e.g. P-1102, TR-SEC-4"
                  className="w-full h-8 px-2.5 bg-surface border border-border-standard rounded font-body-sm text-body-sm text-on-surface input-focus text-xs"
                />
              </div>

              <div>
                <label className="block font-label-caps text-label-caps text-on-surface-variant mb-1 text-[10px]">
                  INPUT FORMAT
                </label>
                <select 
                  value={inputFormat}
                  onChange={(e) => setInputFormat(e.target.value as InputFormatType)}
                  className="w-full h-8 px-2.5 bg-surface border border-border-standard rounded font-body-sm text-body-sm text-on-surface input-focus text-xs"
                >
                  <option value="dpr">DPR Text Report</option>
                  <option value="spreadsheet">Spreadsheet Import</option>
                  <option value="scan">Document Scan / OCR</option>
                  <option value="voice">Voice Note Audio</option>
                  <option value="telemetry">Telemetry Feed</option>
                </select>
              </div>

              <div>
                <label className="block font-label-caps text-label-caps text-on-surface-variant mb-1 text-[10px]">
                  PROGRESS COMPLETED ({progress}%)
                </label>
                <div className="flex items-center gap-2 h-8">
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={progress}
                    onChange={(e) => setProgress(Number(e.target.value))}
                    className="w-full accent-primary h-1.5 bg-surface-container rounded cursor-pointer"
                  />
                  <span className="font-technical-data text-xs text-on-surface w-8">{progress}%</span>
                </div>
              </div>

              <div>
                <label className="block font-label-caps text-label-caps text-on-surface-variant mb-1 text-[10px]">
                  ACTUAL START
                </label>
                <input 
                  type="date"
                  value={actualStart}
                  onChange={(e) => setActualStart(e.target.value)}
                  className="w-full h-8 px-2.5 bg-surface border border-border-standard rounded font-technical-data text-technical-data text-on-surface input-focus text-xs"
                />
              </div>

              <div>
                <label className="block font-label-caps text-label-caps text-on-surface-variant mb-1 text-[10px]">
                  CONTRACTOR / CREW
                </label>
                <input 
                  value={contractor}
                  onChange={(e) => setContractor(e.target.value)}
                  placeholder="e.g. Bridge & Roof Co."
                  className="w-full h-8 px-2.5 bg-surface border border-border-standard rounded font-body-sm text-body-sm text-on-surface input-focus text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block font-label-caps text-label-caps text-on-surface-variant mb-1 text-[10px]">
                OBSERVATIONS / EXCEPTION NOTES (OPTIONAL)
              </label>
              <input 
                value={exceptionNote}
                onChange={(e) => setExceptionNote(e.target.value)}
                placeholder="e.g. Weather conditions normal, awaiting crane inspection"
                className="w-full h-8 px-2.5 bg-surface border border-border-standard rounded font-body-sm text-body-sm text-on-surface input-focus text-xs"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 px-3 sm:px-4 py-2.5 border-t border-border-standard bg-panel-accent mt-auto">
            <button 
              type="button"
              onClick={() => setIsNewReportModalOpen(false)}
              className="px-3 py-1.5 border border-border-standard rounded font-body-sm text-body-sm font-medium text-on-surface bg-surface hover:bg-surface-container-low transition-colors cursor-pointer text-xs"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="px-4 py-1.5 rounded font-body-sm text-body-sm font-medium text-on-primary bg-primary hover:bg-primary-container transition-colors shadow-xs cursor-pointer text-xs"
            >
              {t('approveBtn')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
