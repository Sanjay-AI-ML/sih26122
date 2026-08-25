import React, { useState } from 'react';
import { useReviewQueue } from '../context/ReviewQueueContext';
import type { DisciplineType } from "../types";

export const CreateActivityModal: React.FC = () => {
  const {
    isCreateActivityModalOpen,
    setIsCreateActivityModalOpen,
    createMasterActivity,
    activeScheduleItem
  } = useReviewQueue();

  const [wbsPath, _setWbsPath] = useState('01.05.03 | Piping Main Header | Numaligarh');
  const [activityName, setActivityName] = useState(activeScheduleItem ? activeScheduleItem.activityPhrase : 'Pump Installation & Casing Alignment');
  const [level, setLevel] = useState<'L5' | 'L6'>('L6');
  const [discipline, setDiscipline] = useState<DisciplineType>(activeScheduleItem ? activeScheduleItem.discipline : 'Mechanical');
  const [plannedStart, setPlannedStart] = useState('2023-11-15');
  const [plannedFinish, setPlannedFinish] = useState('2023-11-28');
  const [responsibleTeam, setResponsibleTeam] = useState('Subcontractor A - Piping Division');
  const [resources, setResources] = useState<string[]>(['Crane 50T (1)', 'Welding Crew (2)']);
  const [newResourceInput, setNewResourceInput] = useState('');
  const [isAddingResource, setIsAddingResource] = useState(false);

  if (!isCreateActivityModalOpen) return null;

  const handleRemoveResource = (index: number) => {
    setResources(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddResource = () => {
    if (newResourceInput.trim()) {
      setResources(prev => [...prev, newResourceInput.trim()]);
      setNewResourceInput('');
      setIsAddingResource(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMasterActivity({
      wbsPath,
      activityName: activityName || 'New Master Schedule Activity',
      level,
      discipline,
      plannedStart,
      plannedFinish,
      responsibleTeam,
      resources,
      fieldReportContext: activeScheduleItem?.sourceText || 'Field Report Context'
    });
    setIsCreateActivityModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      {/* Modal Backdrop */}
      <div 
        onClick={() => setIsCreateActivityModalOpen(false)}
        aria-hidden="true" 
        className="fixed inset-0 bg-on-surface/50 backdrop-blur-sm z-40 cursor-pointer"
      ></div>

      {/* Modal Container */}
      <div className="relative bg-surface rounded-md w-full max-w-[600px] shadow-xl border border-border-standard z-50 flex flex-col overflow-hidden animate-[fadeIn_0.2s_ease-out] max-h-[92vh]">
        {/* Header */}
        <div className="flex items-start justify-between px-3 sm:px-4 py-2.5 sm:py-3 border-b border-border-standard bg-surface">
          <div>
            <h2 className="font-h2 text-h2 text-primary font-bold">Create New Activity</h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant text-xs">Define a new node in the master schedule</p>
          </div>
          <button 
            onClick={() => setIsCreateActivityModalOpen(false)}
            aria-label="Close modal" 
            className="text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low p-1 rounded transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]" data-icon="close">close</span>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden min-h-0">
          <div className="p-3 sm:p-4 overflow-y-auto flex flex-col gap-3.5 custom-scrollbar flex-1">
            {/* WBS Path Breadcrumb */}
            <div className="bg-surface-container-low p-2 rounded border border-border-standard">
              <span className="font-label-caps text-label-caps text-on-surface-variant block mb-0.5 text-[10px]">WBS PATH</span>
              <div className="font-technical-data text-technical-data text-on-surface flex items-center gap-1.5 text-xs flex-wrap">
                <span className="text-primary font-medium">01.05.03</span>
                <span className="text-outline-variant">|</span>
                <span>Piping Main Header</span>
                <span className="text-outline-variant">|</span>
                <span>Numaligarh</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Activity Name */}
              <div className="sm:col-span-2">
                <label className="block font-label-caps text-label-caps text-on-surface-variant mb-1 text-[10px]" htmlFor="activity-name">
                  ACTIVITY NAME
                </label>
                <input 
                  value={activityName}
                  onChange={(e) => setActivityName(e.target.value)}
                  className="w-full h-8 px-2.5 bg-surface border border-border-standard rounded font-body-sm text-body-sm text-on-surface input-focus placeholder-on-surface-variant/50 transition-colors text-xs" 
                  id="activity-name" 
                  placeholder="e.g., Pump Installation" 
                  type="text"
                  required
                />
              </div>

              {/* Level Toggle */}
              <div className="flex flex-col justify-end">
                <label className="block font-label-caps text-label-caps text-on-surface-variant mb-1 text-[10px]">LEVEL</label>
                <div className="flex h-8 bg-surface-container-low rounded border border-border-standard p-0.5">
                  <button 
                    type="button"
                    onClick={() => setLevel('L5')}
                    className={`flex-1 rounded font-body-sm text-body-sm font-medium transition-colors cursor-pointer text-xs ${
                      level === 'L5' ? 'bg-primary text-on-primary shadow-xs' : 'text-on-surface hover:bg-surface-container-high'
                    }`}
                  >
                    L5
                  </button>
                  <button 
                    type="button"
                    onClick={() => setLevel('L6')}
                    className={`flex-1 rounded font-body-sm text-body-sm font-medium transition-colors cursor-pointer text-xs ${
                      level === 'L6' ? 'bg-primary text-on-primary shadow-xs' : 'text-on-surface hover:bg-surface-container-high'
                    }`}
                  >
                    L6
                  </button>
                </div>
              </div>

              {/* Discipline */}
              <div>
                <label className="block font-label-caps text-label-caps text-on-surface-variant mb-1 text-[10px]" htmlFor="discipline">
                  DISCIPLINE
                </label>
                <div className="relative">
                  <select 
                    value={discipline}
                    onChange={(e) => setDiscipline(e.target.value as DisciplineType)}
                    className="w-full h-8 pl-2.5 pr-8 bg-surface border border-border-standard rounded font-body-sm text-body-sm text-on-surface input-focus appearance-none cursor-pointer text-xs" 
                    id="discipline"
                  >
                    <option value="Mechanical">Mechanical</option>
                    <option value="Piping">Piping</option>
                    <option value="Electrical">Electrical</option>
                    <option value="Civil">Civil</option>
                    <option value="Instrumentation">Instrumentation</option>
                    <option value="Drilling">Drilling</option>
                    <option value="Production">Production</option>
                    <option value="Exploration">Exploration</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-[16px]" data-icon="arrow_drop_down">
                    arrow_drop_down
                  </span>
                </div>
              </div>

              {/* Dates */}
              <div>
                <label className="block font-label-caps text-label-caps text-on-surface-variant mb-1 text-[10px]" htmlFor="planned-start">
                  PLANNED START
                </label>
                <div className="relative">
                  <input 
                    value={plannedStart}
                    onChange={(e) => setPlannedStart(e.target.value)}
                    className="w-full h-8 px-2.5 bg-surface border border-border-standard rounded font-technical-data text-technical-data text-on-surface input-focus text-xs" 
                    id="planned-start" 
                    type="date"
                  />
                </div>
              </div>
              <div>
                <label className="block font-label-caps text-label-caps text-on-surface-variant mb-1 text-[10px]" htmlFor="planned-finish">
                  PLANNED FINISH
                </label>
                <div className="relative">
                  <input 
                    value={plannedFinish}
                    onChange={(e) => setPlannedFinish(e.target.value)}
                    className="w-full h-8 px-2.5 bg-surface border border-border-standard rounded font-technical-data text-technical-data text-on-surface input-focus text-xs" 
                    id="planned-finish" 
                    type="date"
                  />
                </div>
              </div>

              {/* Responsible Team */}
              <div className="sm:col-span-2">
                <label className="block font-label-caps text-label-caps text-on-surface-variant mb-1 text-[10px]" htmlFor="responsible-team">
                  RESPONSIBLE TEAM
                </label>
                <input 
                  value={responsibleTeam}
                  onChange={(e) => setResponsibleTeam(e.target.value)}
                  className="w-full h-8 px-2.5 bg-surface border border-border-standard rounded font-body-sm text-body-sm text-on-surface input-focus text-xs" 
                  id="responsible-team" 
                  placeholder="e.g., Subcontractor A - Piping Division" 
                  type="text"
                />
              </div>

              {/* Resources Allocated */}
              <div className="sm:col-span-2">
                <label className="block font-label-caps text-label-caps text-on-surface-variant mb-1 text-[10px]">
                  RESOURCES ALLOCATED
                </label>
                <div className="flex flex-wrap gap-1.5 mb-1.5 p-1.5 min-h-[40px] bg-surface-container-low border border-border-standard rounded">
                  {resources.map((res, index) => {
                    const isCrane = res.toLowerCase().includes('crane');
                    return (
                      <div 
                        key={index}
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-surface border border-border-standard rounded font-body-sm text-body-sm text-on-surface shadow-xs text-xs"
                      >
                        <span className="material-symbols-outlined text-[14px] text-on-surface-variant" data-icon={isCrane ? "precision_manufacturing" : "group"}>
                          {isCrane ? "precision_manufacturing" : "group"}
                        </span>
                        <span>{res}</span>
                        <button 
                          type="button"
                          onClick={() => handleRemoveResource(index)}
                          className="ml-0.5 text-on-surface-variant hover:text-danger cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[14px]" data-icon="close">close</span>
                        </button>
                      </div>
                    );
                  })}
                </div>

                {isAddingResource ? (
                  <div className="flex items-center gap-1.5 mt-1">
                    <input 
                      value={newResourceInput}
                      onChange={(e) => setNewResourceInput(e.target.value)}
                      placeholder="Resource name (e.g., Generator 250kVA)"
                      className="px-2 py-1 bg-surface border border-border-standard rounded text-xs font-body-sm flex-1 input-focus h-7"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddResource();
                        }
                      }}
                    />
                    <button 
                      type="button"
                      onClick={handleAddResource}
                      className="px-2.5 py-1 bg-primary text-on-primary text-xs rounded font-medium h-7"
                    >
                      Add
                    </button>
                    <button 
                      type="button"
                      onClick={() => setIsAddingResource(false)}
                      className="px-2 py-1 text-on-surface-variant text-xs hover:underline"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button 
                    type="button"
                    onClick={() => setIsAddingResource(true)}
                    className="font-body-sm text-body-sm text-primary font-medium hover:underline flex items-center gap-1 cursor-pointer text-xs"
                  >
                    <span className="material-symbols-outlined text-[14px]" data-icon="add">add</span> Add Resource
                  </button>
                )}
              </div>
            </div>

            {/* Field Report Context Box */}
            <div className="bg-source-excerpt border border-[#E8DAB2] p-2.5 rounded mt-1 relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-warning"></div>
              <div className="flex items-center gap-1.5 mb-1">
                <span className="material-symbols-outlined text-warning text-[14px]" data-icon="assignment_turned_in">assignment_turned_in</span>
                <span className="font-label-caps text-label-caps text-[#8B7322] text-[10px]">FIELD REPORT CONTEXT</span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface italic text-xs leading-relaxed">
                "{activeScheduleItem?.sourceText || 'Pump P-1102 alignment done. Ready for final bolting and grout pouring tomorrow morning. Crane required for casing placement.'}"
              </p>
              <div className="mt-1 text-right">
                <span className="font-technical-data text-[10px] text-on-surface-variant">
                  Source: {activeScheduleItem?.eventId || 'FR-2023-11-04-A'}
                </span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 px-3 sm:px-4 py-2.5 border-t border-border-standard bg-panel-accent mt-auto">
            <button 
              type="button"
              onClick={() => setIsCreateActivityModalOpen(false)}
              className="px-3 py-1.5 border border-border-standard rounded font-body-sm text-body-sm font-medium text-on-surface bg-surface hover:bg-surface-container-low transition-colors cursor-pointer text-xs"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="px-4 py-1.5 rounded font-body-sm text-body-sm font-medium text-on-primary bg-primary hover:bg-primary-container transition-colors shadow-xs cursor-pointer text-xs"
            >
              Create Activity
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
