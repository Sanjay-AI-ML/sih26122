import React, { useState } from 'react';
import { useReviewQueue } from '../context/ReviewQueueContext';

export const ExportReportModal: React.FC = () => {
  const { isExportModalOpen, setIsExportModalOpen, exportData, items, t } = useReviewQueue();
  const [exportFormat, setExportFormat] = useState<'CSV' | 'Excel' | 'PDF'>('CSV');
  const [selectedColumns, setSelectedColumns] = useState<string[]>([
    'Event ID',
    'Activity',
    'Discipline',
    'Confidence',
    'Status',
    'Timestamp',
    'Linked Activity'
  ]);

  if (!isExportModalOpen) return null;

  const toggleColumn = (col: string) => {
    setSelectedColumns(prev => 
      prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]
    );
  };

  const handleExport = () => {
    exportData(exportFormat, selectedColumns);
    setIsExportModalOpen(false);
  };

  const availableCols = [
    'Event ID',
    'Activity',
    'Discipline',
    'Confidence',
    'Status',
    'Timestamp',
    'Linked Activity'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      <div 
        onClick={() => setIsExportModalOpen(false)}
        className="fixed inset-0 bg-on-surface/50 backdrop-blur-sm z-40 cursor-pointer"
      ></div>

      <div className="relative bg-surface rounded-md w-full max-w-[480px] shadow-xl border border-border-standard z-50 flex flex-col overflow-hidden animate-[fadeIn_0.2s_ease-out] max-h-[92vh]">
        <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 border-b border-border-standard bg-surface">
          <div>
            <h2 className="font-h2 text-h2 text-primary font-bold">{t('exportTitle')}</h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant text-xs">{t('matchingProgressMsg')}</p>
          </div>
          <button 
            onClick={() => setIsExportModalOpen(false)}
            className="text-on-surface-variant hover:text-on-surface p-1 rounded hover:bg-surface-container-low transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <div className="p-3 sm:p-4 flex flex-col gap-3.5 overflow-y-auto custom-scrollbar">
          {/* Format selection */}
          <div>
            <label className="block font-label-caps text-label-caps text-on-surface-variant mb-1.5 text-[10px]">
              {t('exportFormatLabel')}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['CSV', 'Excel', 'PDF'] as const).map(fmt => (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => setExportFormat(fmt)}
                  className={`py-1.5 px-2.5 rounded border font-body-sm text-body-sm font-medium flex items-center justify-center gap-1.5 cursor-pointer transition-all text-xs ${
                    exportFormat === fmt
                      ? 'border-primary bg-primary text-on-primary shadow-xs'
                      : 'border-border-standard bg-surface hover:bg-surface-container text-on-surface'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {fmt === 'PDF' ? 'picture_as_pdf' : fmt === 'Excel' ? 'table_view' : 'description'}
                  </span>
                  {fmt}
                </button>
              ))}
            </div>
          </div>

          {/* Included Columns */}
          <div>
            <label className="block font-label-caps text-label-caps text-on-surface-variant mb-1.5 text-[10px]">
              {t('columnsToExportLabel')} ({selectedColumns.length}/{availableCols.length})
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 bg-surface-container-low p-2.5 rounded border border-border-standard">
              {availableCols.map(col => {
                const isChecked = selectedColumns.includes(col);
                return (
                  <label key={col} className="flex items-center gap-2 cursor-pointer text-xs font-body-sm text-on-surface">
                    <input 
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleColumn(col)}
                      className="accent-primary rounded"
                    />
                    <span>{t(col)}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Summary info */}
          <div className="bg-panel-accent p-2.5 rounded border border-border-standard text-xs text-on-surface-variant">
            {t("totalrecordsready")} <strong className="text-on-surface font-technical-data">{items.length} {t("records")}</strong>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-3 sm:px-4 py-2.5 border-t border-border-standard bg-panel-accent">
          <button 
            type="button"
            onClick={() => setIsExportModalOpen(false)}
            className="px-3 py-1.5 border border-border-standard rounded font-body-sm text-body-sm font-medium text-on-surface bg-surface hover:bg-surface-container-low transition-colors cursor-pointer text-xs"
          >
            {t("cancel")}
          </button>
          <button 
            type="button"
            onClick={handleExport}
            className="px-4 py-1.5 rounded font-body-sm text-body-sm font-medium text-on-primary bg-primary hover:bg-primary-container transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer text-xs"
          >
            <span className="material-symbols-outlined text-[16px]">download</span>
            {t("download")} {exportFormat}
          </button>
        </div>
      </div>
    </div>
  );
};
