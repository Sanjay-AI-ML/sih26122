import React from 'react';
import { useReviewQueue } from '../context/ReviewQueueContext';
import { useNavigate, useLocation } from 'react-router-dom';
import type { DisciplineType, InputFormatType } from "../types";

export const SideNav: React.FC = () => {
  const {
    counts,
    activeDisciplineFilter,
    setActiveDisciplineFilter,
    activeStatusFilter,
    setActiveStatusFilter,
    activeInputFormatFilter,
    setActiveInputFormatFilter,
    setIsNewReportModalOpen,
    isMobileSidebarOpen,
    setIsMobileSidebarOpen,
    showToast
  } = useReviewQueue();

  const navigate = useNavigate();
  const location = useLocation();

  const closeMobileSidebar = () => {
    if (window.innerWidth < 1024) {
      setIsMobileSidebarOpen(false);
    }
  };

  const handleStatusClick = (statusKey: string) => {
    if (location.pathname !== '/') navigate('/');
    if (activeStatusFilter === statusKey) {
      setActiveStatusFilter(null);
    } else {
      setActiveStatusFilter(statusKey);
    }
    closeMobileSidebar();
  };

  const handleDisciplineClick = (discipline: DisciplineType) => {
    if (location.pathname !== '/') navigate('/');
    if (activeDisciplineFilter === discipline) {
      setActiveDisciplineFilter(null);
    } else {
      setActiveDisciplineFilter(discipline);
    }
    closeMobileSidebar();
  };

  const handleFormatClick = (format: InputFormatType) => {
    if (location.pathname !== '/') navigate('/');
    if (activeInputFormatFilter === format) {
      setActiveInputFormatFilter(null);
    } else {
      setActiveInputFormatFilter(format);
    }
    closeMobileSidebar();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileSidebarOpen && (
        <div 
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-30 lg:hidden"
          aria-hidden="true"
        />
      )}

      <nav 
        className={`fixed left-0 top-11 sm:top-12 bottom-0 w-[220px] bg-surface-container-low border-r border-border-standard flex flex-col z-40 shadow-xs transition-transform duration-200 ease-in-out ${
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Scrollable Menu Container */}
        <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col p-2.5 gap-3">
          {/* Header / Identity */}
          <div className="flex flex-col gap-2 px-1">
            <div 
              className="w-full flex items-center gap-2.5 p-1 rounded-md hover:bg-surface-container cursor-pointer transition-colors" 
              onClick={() => {
                navigate('/');
                closeMobileSidebar();
              }}
            >
              <img 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCmOe-6SCXBR5q1kIBbAyDFylOwmJvwCOmoxmwjHT6oXjBZpeVDjHlOrQd9KDoxMuk0cY5gD1-3QgWtkfUy5BPR-l2wQuSHIQtTTwca9YPwOwpqk1eaVRfc1fy8XKZ-NBqbGFEYhkZhVivi8NM7n93ZC5bnGwrw63Sao4UBL9homJXXBwCgPQ5zmmNHh5-3Rhhugvyh8pMKarVmpHVE1EE8DNTPmkF252eaUG-dDQbuspwQ8N5F3zZ3ZTDyZjSsmL-uxw" 
                alt="Oil India Limited Logo" 
                className="h-8 w-auto object-contain"
              />
              <div className="flex flex-col">
                <h1 className="font-h3 text-h3 text-primary font-bold tracking-tight leading-none">KADAM</h1>
                <p className="font-label-caps text-label-caps text-on-surface-variant text-[8.5px] mt-0.5">OIL INDIA LIMITED</p>
              </div>
            </div>
          </div>

          {/* Primary CTA */}
          <div>
            <button 
              onClick={() => {
                setIsNewReportModalOpen(true);
                closeMobileSidebar();
              }}
              className="w-full bg-primary hover:bg-primary-container text-on-primary font-body-sm text-body-sm py-1.5 px-3 rounded-md flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              New Report
            </button>
          </div>

          {/* Status Chips Summary */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center px-1 mb-0.5">
              <h2 className="font-label-caps text-label-caps text-outline uppercase tracking-wider text-[9.5px]">Queue Status</h2>
              {activeStatusFilter && (
                <button 
                  onClick={() => setActiveStatusFilter(null)}
                  className="text-[9.5px] text-primary hover:underline font-medium cursor-pointer"
                >
                  Reset
                </button>
              )}
            </div>
            <div className="flex flex-col gap-1">
              {/* Auto-Approved */}
              <div 
                onClick={() => handleStatusClick('auto_approved')}
                className={`flex items-center justify-between rounded-md px-2 py-1 border cursor-pointer transition-all ${
                  activeStatusFilter === 'auto_approved' 
                    ? 'bg-green-100 ring-1 ring-success border-green-300 font-semibold shadow-xs' 
                    : 'bg-green-50/70 border-green-200/80 hover:bg-green-100/60 text-success'
                }`}
              >
                <div className="flex items-center gap-1.5 text-success">
                  <span className="material-symbols-outlined text-[15px]">check_circle</span>
                  <span className="font-body-sm text-body-sm font-medium">Auto-Approved</span>
                </div>
                <span className="font-technical-data text-technical-data text-success font-semibold">{counts.autoApproved}</span>
              </div>

              {/* Review */}
              <div 
                onClick={() => handleStatusClick('review')}
                className={`flex items-center justify-between rounded-md px-2 py-1 border cursor-pointer transition-all ${
                  activeStatusFilter === 'review' 
                    ? 'bg-yellow-100 ring-1 ring-warning border-yellow-300 font-semibold shadow-xs' 
                    : 'bg-yellow-50/70 border-yellow-200/80 hover:bg-yellow-100/60'
                }`}
              >
                <div className="flex items-center gap-1.5 text-yellow-800">
                  <span className="material-symbols-outlined text-[15px] text-warning">pending_actions</span>
                  <span className="font-body-sm text-body-sm font-medium text-yellow-800">Review</span>
                </div>
                <span className="font-technical-data text-technical-data text-yellow-800 font-semibold">{counts.review}</span>
              </div>

              {/* Flagged */}
              <div 
                onClick={() => handleStatusClick('flagged')}
                className={`flex items-center justify-between rounded-md px-2 py-1 border cursor-pointer transition-all ${
                  activeStatusFilter === 'flagged' 
                    ? 'bg-red-100 ring-1 ring-danger border-red-300 font-semibold shadow-xs' 
                    : 'bg-red-50/70 border-red-200/80 hover:bg-red-100/60 text-danger'
                }`}
              >
                <div className="flex items-center gap-1.5 text-danger">
                  <span className="material-symbols-outlined text-[15px]">error</span>
                  <span className="font-body-sm text-body-sm font-medium">Flagged</span>
                </div>
                <span className="font-technical-data text-technical-data text-danger font-semibold">{counts.flagged}</span>
              </div>

              {/* In Progress */}
              <div 
                onClick={() => handleStatusClick('in_progress')}
                className={`flex items-center justify-between rounded-md px-2 py-1 border cursor-pointer transition-all ${
                  activeStatusFilter === 'in_progress' 
                    ? 'bg-blue-100 ring-1 ring-primary border-blue-300 font-semibold shadow-xs' 
                    : 'bg-blue-50/70 border-blue-200/80 hover:bg-blue-100/60 text-primary'
                }`}
              >
                <div className="flex items-center gap-1.5 text-primary">
                  <span className="material-symbols-outlined text-[15px]">hourglass_top</span>
                  <span className="font-body-sm text-body-sm font-medium">In Progress</span>
                </div>
                <span className="font-technical-data text-technical-data text-primary font-semibold">{counts.inProgress}</span>
              </div>
            </div>
          </div>

          {/* Disciplines Filter Section */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center px-1 mb-0.5">
              <h2 className="font-label-caps text-label-caps text-outline uppercase tracking-wider text-[9.5px]">Disciplines</h2>
              {activeDisciplineFilter && (
                <button 
                  onClick={() => setActiveDisciplineFilter(null)}
                  className="text-[9.5px] text-primary hover:underline font-medium cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
            <ul className="flex flex-col gap-0.5">
              {/* Piping */}
              <li>
                <button 
                  onClick={() => handleDisciplineClick('Piping')}
                  className={`w-full text-left flex items-center gap-2 px-2 py-1 transition-all font-body-sm text-body-sm rounded-md cursor-pointer ${
                    activeDisciplineFilter === 'Piping' 
                      ? 'bg-primary-fixed text-primary font-semibold' 
                      : 'text-on-surface-variant hover:bg-surface-container'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">settings_input_component</span>
                  Piping
                </button>
              </li>
              {/* Civil */}
              <li>
                <button 
                  onClick={() => handleDisciplineClick('Civil')}
                  className={`w-full text-left flex items-center gap-2 px-2 py-1 transition-all font-body-sm text-body-sm rounded-md cursor-pointer ${
                    activeDisciplineFilter === 'Civil' 
                      ? 'bg-primary-fixed text-primary font-semibold' 
                      : 'text-on-surface-variant hover:bg-surface-container'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">foundation</span>
                  Civil
                </button>
              </li>
              {/* Electrical */}
              <li>
                <button 
                  onClick={() => handleDisciplineClick('Electrical')}
                  className={`w-full text-left flex items-center gap-2 px-2 py-1 transition-all font-body-sm text-body-sm rounded-md cursor-pointer ${
                    activeDisciplineFilter === 'Electrical' 
                      ? 'bg-primary-fixed text-primary font-semibold' 
                      : 'text-on-surface-variant hover:bg-surface-container'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">bolt</span>
                  Electrical
                </button>
              </li>
              {/* Instrumentation */}
              <li>
                <button 
                  onClick={() => handleDisciplineClick('Instrumentation')}
                  className={`w-full text-left flex items-center gap-2 px-2 py-1 transition-all font-body-sm text-body-sm rounded-md cursor-pointer ${
                    activeDisciplineFilter === 'Instrumentation' 
                      ? 'bg-primary-fixed text-primary font-semibold' 
                      : 'text-on-surface-variant hover:bg-surface-container'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">precision_manufacturing</span>
                  Instrumentation
                </button>
              </li>
              {/* Drilling */}
              <li>
                <button 
                  onClick={() => handleDisciplineClick('Drilling')}
                  className={`w-full text-left flex items-center gap-2 px-2 py-1 transition-all font-body-sm text-body-sm rounded-md cursor-pointer ${
                    activeDisciplineFilter === 'Drilling' 
                      ? 'bg-primary-fixed text-primary font-semibold' 
                      : 'text-on-surface-variant hover:bg-surface-container'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">build</span>
                  Drilling
                </button>
              </li>
              {/* Production */}
              <li>
                <button 
                  onClick={() => handleDisciplineClick('Production')}
                  className={`w-full text-left flex items-center gap-2 px-2 py-1 transition-all font-body-sm text-body-sm rounded-md cursor-pointer ${
                    activeDisciplineFilter === 'Production' 
                      ? 'bg-primary-fixed text-primary font-semibold' 
                      : 'text-on-surface-variant hover:bg-surface-container'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">oil_barrel</span>
                  Production
                </button>
              </li>
              {/* Exploration */}
              <li>
                <button 
                  onClick={() => handleDisciplineClick('Exploration')}
                  className={`w-full text-left flex items-center gap-2 px-2 py-1 transition-all font-body-sm text-body-sm rounded-md cursor-pointer ${
                    activeDisciplineFilter === 'Exploration' 
                      ? 'bg-primary-fixed text-primary font-semibold' 
                      : 'text-on-surface-variant hover:bg-surface-container'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">explore</span>
                  Exploration
                </button>
              </li>
            </ul>
          </div>

          {/* Input Format Filters */}
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center px-1 mb-0.5">
              <h2 className="font-label-caps text-label-caps text-outline uppercase tracking-wider text-[9.5px]">Input Format</h2>
              {activeInputFormatFilter && (
                <button 
                  onClick={() => setActiveInputFormatFilter(null)}
                  className="text-[9.5px] text-primary hover:underline font-medium cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
            <ul className="flex flex-col gap-0.5">
              <li>
                <button 
                  onClick={() => handleFormatClick('dpr')}
                  className={`w-full text-left flex items-center gap-2 px-2 py-1 font-body-sm text-body-sm rounded-md transition-all cursor-pointer ${
                    activeInputFormatFilter === 'dpr'
                      ? 'bg-primary-fixed text-primary font-semibold'
                      : 'text-on-surface-variant hover:bg-surface-container'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">description</span>
                  DPR
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleFormatClick('spreadsheet')}
                  className={`w-full text-left flex items-center gap-2 px-2 py-1 font-body-sm text-body-sm rounded-md transition-all cursor-pointer ${
                    activeInputFormatFilter === 'spreadsheet'
                      ? 'bg-primary-fixed text-primary font-semibold'
                      : 'text-on-surface-variant hover:bg-surface-container'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">table_chart</span>
                  Spreadsheet
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleFormatClick('scan')}
                  className={`w-full text-left flex items-center gap-2 px-2 py-1 font-body-sm text-body-sm rounded-md transition-all cursor-pointer ${
                    activeInputFormatFilter === 'scan'
                      ? 'bg-primary-fixed text-primary font-semibold'
                      : 'text-on-surface-variant hover:bg-surface-container'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">document_scanner</span>
                  Scan
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleFormatClick('voice')}
                  className={`w-full text-left flex items-center gap-2 px-2 py-1 font-body-sm text-body-sm rounded-md transition-all cursor-pointer ${
                    activeInputFormatFilter === 'voice'
                      ? 'bg-primary-fixed text-primary font-semibold'
                      : 'text-on-surface-variant hover:bg-surface-container'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">mic</span>
                  Voice
                </button>
              </li>
            </ul>
          </div>

          {/* Confidence Mix Bar */}
          <div className="px-1 pt-0.5">
            <div className="flex justify-between items-end mb-1">
              <span className="font-label-caps text-label-caps text-outline text-[9.5px]">System Confidence</span>
              <span className="font-technical-data text-[9.5px] text-on-surface-variant font-medium">Avg 92%</span>
            </div>
            <div className="w-full h-1.5 rounded-full overflow-hidden flex bg-surface-container-high">
              <div className="bg-success h-full" style={{ width: '70%' }} title="High Confidence (70%)"></div>
              <div className="bg-warning h-full" style={{ width: '20%' }} title="Medium Confidence (20%)"></div>
              <div className="bg-danger h-full" style={{ width: '10%' }} title="Low Confidence (10%)"></div>
            </div>
          </div>

          {/* Footer / Settings & Profile */}
          <div className="border-t border-border-standard pt-2 flex flex-col gap-1.5 mt-auto">
            <button 
              onClick={() => showToast('Planner Console Settings: v2.4.1 (OIL Enterprise Build)', undefined, 'info')}
              className="w-full text-left flex items-center gap-2 px-2 py-1 text-on-surface-variant hover:bg-surface-container transition-all font-body-sm text-body-sm rounded-md cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">settings</span>
              Settings
            </button>

            {/* Profile Card */}
            <div 
              onClick={() => showToast('A. Sharma (Chief Engineer) - Oil India Ltd. Duliajan Field Ops', undefined, 'info')}
              className="flex items-center gap-2 px-2 py-1.5 border border-border-standard rounded-md bg-surface-container-lowest cursor-pointer hover:bg-surface-container transition-colors shadow-2xs"
            >
              <img 
                alt="Profile" 
                className="w-7 h-7 rounded-full object-cover border border-border-standard flex-shrink-0" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCnhinY23br8Izv51EOYXz7YjIrwrLKmrO6eIuwmQHNdOx1Fy5CMIk0uRdWClCv-ToZs6sFGknua8wj4thwcnwcvmAGmPvCWsfDlwjDe_fcIwLV3w2wgdsEAReRbAON9KRXAGmfqcjy0XPCLu_EZN05cidU-2klFcpqL129ZRMo2TChtF1kDBa4UU0jol7kE-OP4fJMd2wofIcsDPD9ULU50EY3BDCu7BIwM3xiqZmG6-nctue-c7A_"
              />
              <div className="flex flex-col min-w-0">
                <span className="font-body-sm text-body-sm font-semibold truncate text-on-surface leading-tight">A. Sharma</span>
                <span className="font-label-caps text-[8.5px] text-outline truncate leading-tight mt-0.5">Chief Engineer</span>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
};
