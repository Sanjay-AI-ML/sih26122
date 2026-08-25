import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useReviewQueue } from '../context/ReviewQueueContext';

export const RecordDetailScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    getItemById,
    approveItem,
    discardItem,
    setIsScheduleModalOpen,
    setActiveScheduleItem,
    setSelectedCandidate,
    confirmScheduleMatch
  } = useReviewQueue();

  const [activeFormatTab, setActiveFormatTab] = useState<'dpr' | 'spreadsheet' | 'scan' | 'voice'>('dpr');
  const [selectedCandidateIndex, setSelectedCandidateIndex] = useState<number>(0);

  const item = getItemById(id || '') || getItemById('OIL-2026-X882') || getItemById('EV-8492A');

  if (!item) {
    return (
      <main className="lg:ml-[220px] ml-0 mt-11 sm:mt-12 w-full lg:w-[calc(100%-220px)] min-h-[calc(100vh-3rem)] flex flex-col p-4 bg-background">
        <div className="p-8 text-center bg-surface-container-lowest border border-border-standard rounded-md">
          <p className="text-on-surface mb-4">Record with ID "{id}" was not found.</p>
          <button 
            onClick={() => navigate('/')} 
            className="px-4 py-1.5 bg-primary text-on-primary rounded text-body-sm font-medium cursor-pointer"
          >
            Back to Queue
          </button>
        </div>
      </main>
    );
  }

  const handleOpenScheduleMatchModal = (candidateIndex?: number) => {
    setActiveScheduleItem(item);
    if (typeof candidateIndex === 'number' && item.candidates[candidateIndex]) {
      setSelectedCandidate(item.candidates[candidateIndex]);
    } else if (item.candidates.length > 0) {
      setSelectedCandidate(item.candidates[0]);
    }
    setIsScheduleModalOpen(true);
  };

  const handleConfirmCandidateMatch = () => {
    const candidate = item.candidates[selectedCandidateIndex] || item.candidates[0];
    if (candidate) {
      confirmScheduleMatch(item.id, candidate);
      navigate('/');
    } else {
      approveItem(item.id);
      navigate('/');
    }
  };

  const handleDiscard = () => {
    discardItem(item.id);
    navigate('/');
  };

  return (
    <div className="lg:ml-[220px] ml-0 mt-11 sm:mt-12 w-full lg:w-[calc(100%-220px)] min-h-[calc(100vh-3rem)] bg-background text-on-surface flex flex-col font-body-md overflow-hidden relative">
      {/* Mock Queue Background to show overlay effect */}
      <div className="absolute inset-0 z-0 p-3 sm:p-4 opacity-30 pointer-events-none">
        <div className="border border-border-standard rounded-lg h-full bg-surface-container-lowest"></div>
      </div>

      {/* Detail View Panel Overlay */}
      <main className="absolute inset-x-0 bottom-0 top-[1%] sm:top-[2%] bg-surface-container-lowest border-t border-border-standard shadow-lg rounded-t-lg flex flex-col z-10 transition-transform duration-300 ease-in-out">
        {/* Header */}
        <header className="flex justify-between items-center px-3 sm:px-4 py-2.5 sm:py-3 border-b border-border-standard bg-surface">
          <div className="flex items-center gap-2">
            <span aria-hidden="true" className="material-symbols-outlined text-on-surface-variant text-[18px]" data-icon="description">description</span>
            <h2 className="font-h2 text-h2 text-primary flex items-center flex-wrap gap-1 sm:gap-2">
              <span>Reviewing:</span>
              <span className="font-technical-data text-technical-data text-on-surface font-bold">
                {item.id}
              </span>
              <span className="text-[11px] px-1.5 py-0.5 rounded bg-surface-container border border-border-standard font-technical-data text-outline font-normal">
                {item.eventId}
              </span>
            </h2>
          </div>
          <button 
            onClick={() => navigate('/')}
            aria-label="Close panel" 
            className="text-on-surface-variant hover:text-danger hover:bg-error-container rounded p-1 transition-colors flex items-center justify-center h-7 w-7 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]" data-icon="close">close</span>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-border-standard custom-scrollbar">
          {/* Left Column: Source & Extraction */}
          <div className="flex-1 p-3 sm:p-4 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
            {/* Format Tabs */}
            <div className="flex gap-1 border-b border-border-standard overflow-x-auto">
              <button 
                onClick={() => setActiveFormatTab('dpr')}
                className={`px-3 py-1.5 font-label-caps text-label-caps transition-colors cursor-pointer whitespace-nowrap ${
                  activeFormatTab === 'dpr'
                    ? 'border-b-2 border-primary text-primary font-bold'
                    : 'border-b-2 border-transparent text-on-surface-variant hover:text-on-surface'
                }`}
              >
                DPR Text
              </button>
              <button 
                onClick={() => setActiveFormatTab('spreadsheet')}
                className={`px-3 py-1.5 font-label-caps text-label-caps transition-colors cursor-pointer whitespace-nowrap ${
                  activeFormatTab === 'spreadsheet'
                    ? 'border-b-2 border-primary text-primary font-bold'
                    : 'border-b-2 border-transparent text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Spreadsheet
              </button>
              <button 
                onClick={() => setActiveFormatTab('scan')}
                className={`px-3 py-1.5 font-label-caps text-label-caps transition-colors cursor-pointer whitespace-nowrap ${
                  activeFormatTab === 'scan'
                    ? 'border-b-2 border-primary text-primary font-bold'
                    : 'border-b-2 border-transparent text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Scan
              </button>
              <button 
                onClick={() => setActiveFormatTab('voice')}
                className={`px-3 py-1.5 font-label-caps text-label-caps transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                  activeFormatTab === 'voice'
                    ? 'border-b-2 border-primary text-primary font-bold'
                    : 'border-b-2 border-transparent text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[15px]" data-icon="mic">mic</span> Voice
              </button>
            </div>

            {/* Source Excerpt */}
            <div className="flex flex-col gap-1.5">
              <h3 className="font-h3 text-h3 text-on-surface font-semibold">Source Excerpt</h3>
              <div className="bg-source-excerpt border border-warning/30 rounded-md p-3">
                {activeFormatTab === 'dpr' && (
                  <p className="font-body-lg text-body-lg text-on-surface leading-relaxed">
                    <span className="bg-warning/20 font-medium px-1 rounded text-tertiary-container border border-warning/40">
                      {item.tagId || 'Pump P-1102'}
                    </span>{' '}
                    <span className="bg-warning/20 font-medium px-1 rounded text-tertiary-container border border-warning/40">
                      {item.activityPhrase.split(' ')[0] || 'alignment'}
                    </span>{' '}
                    and{' '}
                    <span className="bg-warning/20 font-medium px-1 rounded text-tertiary-container border border-warning/40">
                      {item.activityPhrase.split(' ')[2] || 'grouting'}
                    </span>{' '}
                    completed by evening shift. Area cleared.
                  </p>
                )}
                {activeFormatTab === 'spreadsheet' && (
                  <div className="font-technical-data text-technical-data text-on-surface p-2 bg-white/60 rounded border border-warning/20 overflow-x-auto">
                    {item.formatTabs?.spreadsheet || `TAG=${item.tagId || 'P-1102'} | DISCIPLINE=${item.discipline.toUpperCase()} | STATUS=COMPLETED | ACT_START=${item.timestamp} | PROG=${item.progress || 85}%`}
                  </div>
                )}
                {activeFormatTab === 'scan' && (
                  <div className="flex items-center gap-3 p-2 bg-white/60 rounded border border-warning/20">
                    <span className="material-symbols-outlined text-[28px] text-primary">document_scanner</span>
                    <div>
                      <div className="font-medium text-body-sm text-on-surface">{item.formatTabs?.scanUrl || `Daily_Report_Scan_${item.eventId}.pdf`}</div>
                      <div className="font-technical-data text-[10px] text-outline">Verified OCR extraction · 300 DPI Monochrome</div>
                    </div>
                  </div>
                )}
                {activeFormatTab === 'voice' && (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                      <span className="material-symbols-outlined text-[15px]">graphic_eq</span>
                      Audio Transcription (Hindi / English Mixed)
                    </div>
                    <p className="font-body-md text-body-md italic text-on-surface">
                      "{item.formatTabs?.voiceTranscription || item.sourceText}"
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Extracted Fields Table */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-end mb-0.5">
                <h3 className="font-h3 text-h3 text-on-surface font-semibold">Extracted Fields</h3>
                <div className="inline-flex items-center gap-1 px-2 py-1 rounded bg-warning/20 border border-warning/30 text-tertiary-container font-label-caps text-label-caps text-[10px] shadow-2xs">
                  <span className="material-symbols-outlined text-[12px]" data-icon="error">error</span>
                  Needs Review · {item.confidenceScore}% confidence
                </div>
              </div>
              <div className="border border-border-standard rounded-md overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[380px]">
                  <thead className="bg-panel-accent border-b border-border-standard">
                    <tr>
                      <th className="py-1.5 px-2.5 font-label-caps text-label-caps text-on-surface-variant text-[10px]">Field</th>
                      <th className="py-1.5 px-2.5 font-label-caps text-label-caps text-on-surface-variant text-[10px]">Extracted Value</th>
                      <th className="py-1.5 px-2.5 font-label-caps text-label-caps text-on-surface-variant text-[10px]">System Mapping</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-standard font-body-sm text-body-sm">
                    {item.extractedFields.map((field, idx) => {
                      const isTagField = field.fieldName.toLowerCase().includes('tag');
                      const isStatusField = field.fieldName.toLowerCase().includes('status');
                      const isProgressField = field.fieldName.toLowerCase().includes('progress');
                      const isDisciplineField = field.fieldName.toLowerCase().includes('discipline');

                      return (
                        <tr 
                          key={idx}
                          className={`hover:bg-primary-fixed/30 transition-colors ${field.hasWarning ? 'bg-warning/5' : ''}`}
                        >
                          <td className={`py-2 px-2.5 font-body-sm text-body-sm text-on-surface-variant align-middle ${field.hasWarning ? 'border-l-2 border-warning pl-[8px]' : ''}`}>
                            {field.fieldName}
                          </td>
                          <td className={`py-2 px-2.5 font-body-sm text-body-sm align-middle ${isTagField ? 'font-technical-data text-technical-data text-tertiary-container font-medium' : 'text-on-surface font-medium'}`}>
                            {field.extractedValue}
                          </td>
                          <td className="py-2 px-2.5 align-middle">
                            {isDisciplineField ? (
                              <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-surface-container-high text-on-surface font-body-sm text-body-sm border border-border-standard text-xs">
                                <span className="material-symbols-outlined text-[14px] text-primary" data-icon="settings_input_component">settings_input_component</span>
                                {field.systemMapping}
                              </div>
                            ) : isTagField ? (
                              <div className="inline-flex items-center gap-1.5">
                                <span className="font-technical-data text-technical-data text-on-surface border border-border-standard px-1 py-0.5 rounded bg-surface text-xs">
                                  {field.systemMapping}
                                </span>
                                {field.hasWarning && (
                                  <span className="material-symbols-outlined text-[14px] text-warning" data-icon="help" title="Low confidence match">help</span>
                                )}
                              </div>
                            ) : isStatusField ? (
                              <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-success/10 text-[#2C5B0F] border border-success/30 font-label-caps text-label-caps text-[10px]">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#2C5B0F]"></span>
                                {field.systemMapping}
                              </div>
                            ) : isProgressField ? (
                              <div className="flex items-center gap-1.5">
                                <span className="font-technical-data text-technical-data text-on-surface w-7">{field.systemMapping}</span>
                                <div className="h-1.5 w-20 bg-surface-variant rounded-full overflow-hidden">
                                  <div className="h-full bg-primary" style={{ width: `${field.progressPercent || 85}%` }}></div>
                                </div>
                              </div>
                            ) : (
                              <span className="font-technical-data text-technical-data text-on-surface">
                                {field.systemMapping}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Column: Match Candidates & Actions */}
          <div className="w-full lg:w-[360px] xl:w-[390px] flex-shrink-0 bg-surface flex flex-col">
            <div className="p-3 sm:p-4 flex flex-col gap-3 flex-1 overflow-y-auto custom-scrollbar">
              <h3 className="font-h3 text-h3 text-on-surface flex items-center gap-1.5 font-semibold">
                <span className="material-symbols-outlined text-primary text-[18px]" data-icon="compare_arrows">compare_arrows</span>
                Schedule Match Candidates
              </h3>
              <div className="flex flex-col gap-2.5">
                {item.candidates.map((cand, idx) => {
                  const isSelected = selectedCandidateIndex === idx;
                  const isRecommended = cand.isRecommended;

                  return (
                    <div
                      key={cand.id}
                      onClick={() => setSelectedCandidateIndex(idx)}
                      className={`rounded-md p-2.5 transition-all cursor-pointer relative ${
                        isSelected
                          ? 'border-2 border-primary bg-primary-fixed/20 shadow-xs'
                          : 'border border-border-standard bg-surface hover:bg-surface-container-low hover:shadow-xs'
                      }`}
                    >
                      {isRecommended && (
                        <div className="absolute top-0 right-0 bg-primary text-on-primary px-1.5 py-0.5 rounded-bl-md font-label-caps text-[9px] font-semibold">
                          Recommended
                        </div>
                      )}
                      {isSelected && (
                        <div className="absolute right-2.5 top-2.5 text-primary">
                          <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                            check_circle
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between items-start mb-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-technical-data text-technical-data text-primary font-bold">
                            {cand.id}
                          </span>
                          <span className="font-label-caps text-[9px] text-on-surface bg-surface-container-high px-1 py-0.5 rounded border border-border-standard uppercase">
                            {cand.discipline}
                          </span>
                        </div>
                        {!isSelected && (
                          <div className={`flex items-center gap-0.5 font-technical-data text-technical-data ${cand.matchScore >= 0.7 ? 'text-success' : 'text-warning'}`}>
                            <span className="material-symbols-outlined text-[13px]">check_circle</span>
                            {cand.matchScore}
                          </div>
                        )}
                      </div>

                      <h4 className="font-body-md text-body-md text-on-surface font-medium mb-1 pr-6 leading-snug">
                        {cand.title}
                      </h4>

                      <div className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">account_tree</span>
                        <span className="text-[11px] truncate">{cand.wbsPath}</span>
                      </div>

                      {cand.rationale && (
                        <div className="bg-surface border border-primary/20 rounded p-1.5 mt-1.5">
                          <p className="font-body-sm text-body-sm text-on-surface-variant text-[11px] leading-normal">
                            <strong className="text-on-surface">Rationale:</strong> {cand.rationale}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Open Schedule Match / Browse Master Schedule */}
                <button 
                  onClick={() => handleOpenScheduleMatchModal(selectedCandidateIndex)}
                  className="w-full py-1.5 border border-dashed border-outline text-primary font-body-sm text-body-sm rounded-md hover:bg-surface-container-low transition-colors flex items-center justify-center gap-1.5 mt-1 cursor-pointer text-xs"
                >
                  <span className="material-symbols-outlined text-[15px]" data-icon="search">search</span> 
                  Browse Master Schedule (Full Match)
                </button>
              </div>
            </div>

            {/* Action Footer */}
            <div className="border-t border-border-standard p-3 bg-surface-container-low flex justify-end gap-2 rounded-br-md">
              <button 
                onClick={handleDiscard}
                className="px-3 py-1.5 border border-outline text-on-surface font-body-md text-body-md rounded-md hover:bg-surface-container-highest transition-colors cursor-pointer text-xs"
              >
                Discard
              </button>
              <button 
                onClick={handleConfirmCandidateMatch}
                className="px-4 py-1.5 text-on-primary font-body-md text-body-md font-medium rounded-md hover:bg-primary-container transition-colors shadow-xs bg-[#1842aa] cursor-pointer text-xs"
              >
                Confirm Match
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
