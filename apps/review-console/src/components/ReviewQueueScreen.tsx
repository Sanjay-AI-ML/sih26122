import React, { useState, useEffect, useRef } from 'react';
import { useReviewQueue } from '../context/ReviewQueueContext';
import { useNavigate } from 'react-router-dom';
import type { InputFormatType, StatusType } from "../types";

export const ReviewQueueScreen: React.FC = () => {
  const {
    filteredItems,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    priorityFilter,
    setPriorityFilter,
    activeStatusFilter,
    setActiveStatusFilter,
    activeDisciplineFilter,
    setActiveDisciplineFilter,
    viewMode,
    setViewMode,
    setIsExportModalOpen,
    t,
    language
  } = useReviewQueue();

  const navigate = useNavigate();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const totalEntries = filteredItems.length;
  const totalPages = Math.ceil(totalEntries / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedItems = filteredItems.slice(startIndex, startIndex + itemsPerPage);

  // Global Cmd+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const getInputIcon = (format: InputFormatType) => {
    switch (format) {
      case 'dpr':
        return <span className="material-symbols-outlined text-[18px]" title={t("dprText")}>description</span>;
      case 'spreadsheet':
        return <span className="material-symbols-outlined text-[18px]" title={t("spreadsheet")}>table_chart</span>;
      case 'scan':
        return <span className="material-symbols-outlined text-[18px]" title={t("scanPDF")}>document_scanner</span>;
      case 'voice':
        return <span className="material-symbols-outlined text-[18px]" title={t("voice")}>mic</span>;
      case 'telemetry':
        return <span className="material-symbols-outlined text-[18px]" title="Telemetry">sensors</span>;
      case 'mobile':
        return <span className="material-symbols-outlined text-[18px]" title="Mobile App">phone_iphone</span>;
      case 'manual':
      default:
        return <span className="material-symbols-outlined text-[18px]" title="Manual Entry">description</span>;
    }
  };

  const getStatusBadge = (status: StatusType, _priority?: string) => {
    switch (status) {
      case 'auto_approved':
        return (
          <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-green-100 text-success" title={t("autoApproved")}>
            <span className="material-symbols-outlined text-[14px]">check_circle</span>
          </span>
        );
      case 'flagged':
        return (
          <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-red-100 text-danger" title={t("flagged")}>
            <span className="material-symbols-outlined text-[14px]">error</span>
          </span>
        );
      case 'in_progress':
      case 'pending':
        return (
          <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-blue-100 text-primary" title={t("inProgress")}>
            <span className="material-symbols-outlined text-[14px]">hourglass_top</span>
          </span>
        );
      case 'review':
      default:
        return (
          <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-yellow-100 text-yellow-800" title={t("review")}>
            <span className="material-symbols-outlined text-[14px]">pending_actions</span>
          </span>
        );
    }
  };

  return (
    <main className="lg:ml-[220px] ml-0 mt-11 sm:mt-12 w-full lg:w-[calc(100%-220px)] min-h-[calc(100vh-3rem)] flex flex-col p-3 sm:p-4 lg:p-5 bg-background transition-all">
      {/* Header Area */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-4 pb-3 border-b border-border-standard gap-3">
        <div>
          <h2 className="font-h1 text-h1 text-on-surface tracking-tight font-bold">{t('reviewQueue')}</h2>
          <p className="font-body-sm text-body-sm text-outline mt-0.5">{t('queueSubtitle')}</p>
        </div>
        {/* Actions & Search */}
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
          {/* Search */}
          <div className="relative flex items-center flex-1 sm:flex-initial">
            <span className="material-symbols-outlined absolute left-2.5 text-outline text-[16px]">search</span>
            <input 
              ref={searchInputRef}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-8 pr-10 py-1 border border-border-standard rounded font-body-sm text-body-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary w-full sm:w-60 bg-surface-container-lowest text-on-surface transition-all" 
              placeholder={t("searchPlaceholder")} 
              type="text"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-8 text-outline hover:text-on-surface text-[14px]"
              >
                ×
              </button>
            )}
            <span className="absolute right-2 font-technical-data text-[9px] text-outline border border-border-standard rounded px-1 bg-surface-container hidden sm:inline-block">⌘K</span>
          </div>
          {/* Export Button */}
          <button 
            onClick={() => setIsExportModalOpen(true)}
            className="border border-outline hover:bg-surface-container text-on-surface font-body-sm text-body-sm py-1 px-3 rounded-md flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shadow-2xs"
          >
            <span className="material-symbols-outlined text-[16px]">download</span>
            <span className="hidden xs:inline-block">{t('export')}</span>
          </button>
        </div>
      </header>

      {/* Queue Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3 bg-surface-container-lowest p-2 border border-border-standard rounded-md shadow-xs">
        <div className="flex gap-2 items-center flex-wrap w-full sm:w-auto">
          {/* Status filter */}
          <div className="relative">
            <select
              value={activeStatusFilter || 'all'}
              onChange={(e) => {
                setActiveStatusFilter(e.target.value === 'all' ? null : e.target.value);
                setCurrentPage(1);
              }}
              className="appearance-none flex items-center gap-1 pl-2.5 pr-7 py-1 bg-surface-container hover:bg-surface-container-high border border-border-standard rounded font-body-sm text-body-sm text-on-surface transition-colors cursor-pointer outline-none text-xs"
            >
              <option value="all">{`Status: ${t("all")}`}</option>
              <option value="auto_approved">{`Status: ${t("autoApproved")}`}</option>
              <option value="review">{`Status: ${t("review")}`}</option>
              <option value="flagged">{`Status: ${t("flagged")}`}</option>
              <option value="in_progress">{`Status: ${t("inProgress")}`}</option>
            </select>
            <span className="material-symbols-outlined text-[15px] absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">
              arrow_drop_down
            </span>
          </div>

          {/* Sort dropdown */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none flex items-center gap-1 pl-2.5 pr-7 py-1 bg-surface-container hover:bg-surface-container-high border border-border-standard rounded font-body-sm text-body-sm text-on-surface transition-colors cursor-pointer outline-none text-xs"
            >
              <option value="newest">{`Sort: ${t("newest")}`}</option>
              <option value="oldest">{`Sort: ${t("oldest")}`}</option>
              <option value="priority">{`Sort: ${t("priority")}`}</option>
              <option value="confidence">{`Sort: ${t("confidence")}`}</option>
            </select>
            <span className="material-symbols-outlined text-[15px] absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">
              arrow_drop_down
            </span>
          </div>

          {/* Priority dropdown */}
          <div className="relative">
            <select
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="appearance-none flex items-center gap-1 pl-2.5 pr-7 py-1 bg-surface-container hover:bg-surface-container-high border border-border-standard rounded font-body-sm text-body-sm text-on-surface transition-colors cursor-pointer outline-none text-xs"
            >
              <option value="all">{`Priority: ${t("all")}`}</option>
              <option value="High">Priority: High</option>
              <option value="Medium">Priority: Medium</option>
              <option value="Low">Priority: Low</option>
            </select>
            <span className="material-symbols-outlined text-[15px] absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">
              arrow_drop_down
            </span>
          </div>

          {/* Active filter badges if any */}
          {(activeDisciplineFilter || activeStatusFilter || priorityFilter !== 'all' || searchQuery) && (
            <div className="flex items-center gap-1.5 flex-wrap text-xs text-primary">
              <span className="font-medium text-[11px]">Active:</span>
              {activeDisciplineFilter && (
                <span className="bg-primary-fixed text-primary px-1.5 py-0.5 rounded border border-primary/20 flex items-center gap-1 text-[11px]">
                  {activeDisciplineFilter}
                  <button onClick={() => setActiveDisciplineFilter(null)} className="hover:font-bold">×</button>
                </span>
              )}
              {activeStatusFilter && (
                <span className="bg-primary-fixed text-primary px-1.5 py-0.5 rounded border border-primary/20 flex items-center gap-1 text-[11px]">
                  {activeStatusFilter}
                  <button onClick={() => setActiveStatusFilter(null)} className="hover:font-bold">×</button>
                </span>
              )}
              {searchQuery && (
                <span className="bg-primary-fixed text-primary px-1.5 py-0.5 rounded border border-primary/20 flex items-center gap-1 text-[11px]">
                  "{searchQuery}"
                  <button onClick={() => setSearchQuery('')} className="hover:font-bold">×</button>
                </span>
              )}
            </div>
          )}
        </div>

        {/* View Toggle */}
        <div className="flex border border-border-standard rounded overflow-hidden self-end sm:self-auto">
          <button 
            onClick={() => setViewMode('table')}
            title="Table View"
            className={`px-2 py-1 transition-colors cursor-pointer ${
              viewMode === 'table' ? 'bg-surface-container-high text-primary' : 'bg-surface-container-lowest text-outline hover:bg-surface-container'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">table_rows</span>
          </button>
          <button 
            onClick={() => setViewMode('grid')}
            title="Grid View"
            className={`px-2 py-1 transition-colors cursor-pointer ${
              viewMode === 'grid' ? 'bg-surface-container-high text-primary' : 'bg-surface-container-lowest text-outline hover:bg-surface-container'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">grid_view</span>
          </button>
        </div>
      </div>

      {/* Main View: Table OR Grid */}
      {viewMode === 'table' ? (
        <div className="flex-grow border border-border-standard rounded-md bg-surface-container-lowest overflow-hidden shadow-xs flex flex-col">
          <div className="overflow-x-auto flex-grow custom-scrollbar">
            <table className="w-full table-fixed text-left border-collapse min-w-[760px]">
              <thead className="sticky top-0 bg-[#F5F5F5] border-b border-border-standard z-20">
                <tr>
                  <th className="py-2 px-3 font-label-caps text-label-caps text-on-surface-variant tracking-wider w-20 text-center text-[10px]">{t("status")}</th>
                  <th className="py-2 px-3 font-label-caps text-label-caps text-on-surface-variant tracking-wider w-24 text-[10px]">{t("eventIdCol")}</th>
                  <th className="py-2 px-3 font-label-caps text-label-caps text-on-surface-variant tracking-wider w-20 text-center text-[10px]">{t("inputFormat")}</th>
                  <th className="py-2 px-3 font-label-caps text-label-caps text-on-surface-variant tracking-wider text-[10px]">{t("descriptionCol")}</th>
                  <th className="py-2 px-3 font-label-caps text-label-caps text-on-surface-variant tracking-wider w-32 text-[10px]">{t("disciplines")}</th>
                  <th className="py-2 px-3 font-label-caps text-label-caps text-on-surface-variant tracking-wider w-36 text-[10px]">{t("date")}</th>
                  <th className="py-2 px-3 font-label-caps text-label-caps text-on-surface-variant tracking-wider w-20 text-center text-[10px]">{t("actionsCol")}</th>
                </tr>
              </thead>
              <tbody className="font-body-sm text-body-sm text-on-surface divide-y divide-border-standard">
                {paginatedItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-outline">
                      <span className="material-symbols-outlined text-[32px] text-outline mb-1">inbox</span>
                      <p className="text-body-sm">{t('noItemsFound')}</p>
                      <button 
                        onClick={() => {
                          setActiveStatusFilter(null);
                          setActiveDisciplineFilter(null);
                          setPriorityFilter('all');
                          setSearchQuery('');
                        }}
                        className="mt-2 text-primary text-body-sm font-medium hover:underline cursor-pointer"
                      >
                        {t('reset')}
                      </button>
                    </td>
                  </tr>
                ) : (
                  paginatedItems.map((item, index) => {
                    const isFlagged = item.status === 'flagged';
                    const isEven = index % 2 === 1;

                    return (
                      <tr
                        key={item.id}
                        onClick={() => navigate(`/record/${item.id}`)}
                        className={`queue-row cursor-pointer transition-all ${
                          isEven ? 'bg-[#f9f9f9]' : 'bg-surface-container-lowest'
                        } ${isFlagged ? 'border-l-4 border-l-danger' : ''}`}
                      >
                        <td className="py-2 px-3 text-center">
                          {getStatusBadge(item.status, item.priority)}
                        </td>
                        <td className="py-2 px-3 font-technical-data text-technical-data text-outline">
                          {item.eventId}
                        </td>
                        <td className="py-2 px-3 text-center text-outline">
                          {getInputIcon(item.inputFormat)}
                        </td>
                        <td className={`py-2 px-3 truncate max-w-[260px] ${isFlagged ? 'font-medium text-danger' : item.status === 'in_progress' ? 'text-on-surface-variant italic' : item.status === 'auto_approved' ? 'text-on-surface-variant' : 'font-medium'}`}>
                          {t(item.activityDescription) || item.activityDescription}
                        </td>
                        <td className="py-2 px-3">
                          <span className="px-1.5 py-0.5 border border-border-standard rounded text-[10.5px] bg-surface-container">
                            {t(item.discipline?.toLowerCase()) || item.discipline}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-outline text-[11px]">
                          {item.timestamp}
                        </td>
                        <td className="py-2 px-3 text-center text-primary">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/record/${item.id}`);
                            }}
                            className="hover:bg-primary-fixed p-1 rounded transition-colors cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Pagination/Footer */}
          <div className="border-t border-border-standard bg-surface-container px-3 py-1.5 flex flex-col sm:flex-row justify-between items-center text-body-sm text-outline font-body-sm gap-2">
            <span className="text-[11px]">
              {language === 'EN' ? `Showing ${totalEntries === 0 ? 0 : startIndex + 1} to ${Math.min(startIndex + itemsPerPage, totalEntries)} of ${totalEntries} entries` : `${totalEntries} प्रविष्टियों में से ${totalEntries === 0 ? 0 : startIndex + 1} से ${Math.min(startIndex + itemsPerPage, totalEntries)} दिखाई जा रही हैं`}
            </span>
            <div className="flex gap-1">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-2 py-0.5 border border-border-standard rounded bg-surface-container-lowest hover:bg-surface-container-high disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed text-xs"
              >
                {t("prev")}
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`px-2 py-0.5 border rounded cursor-pointer text-xs ${
                    currentPage === pageNum
                      ? 'border-primary bg-primary text-on-primary font-medium'
                      : 'border-border-standard bg-surface-container-lowest hover:bg-surface-container-high text-on-surface'
                  }`}
                >
                  {pageNum}
                </button>
              ))}
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="px-2 py-0.5 border border-border-standard rounded bg-surface-container-lowest hover:bg-surface-container-high disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed text-xs"
              >
                {t("next")}
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Grid View Layout (Screen 3) */
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {paginatedItems.map((item) => {
            const isFlagged = item.status === 'flagged';
            const isReview = item.status === 'review';
            const isPending = item.status === 'pending' || item.status === 'in_progress';
            const isApproved = item.status === 'auto_approved';

            let borderClass = 'border-border-standard';
            if (isFlagged) borderClass = 'border-border-standard border-l-4 border-l-danger';
            if (isReview) borderClass = 'border-border-standard border-l-4 border-l-warning';

            return (
              <article
                key={item.id}
                onClick={() => navigate(`/record/${item.id}`)}
                className={`bg-white rounded-md border p-3 flex flex-col gap-2.5 hover:shadow-md transition-shadow cursor-pointer relative overflow-hidden group ${borderClass}`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-1.5">
                    {isFlagged && (
                      <>
                        <span className="material-symbols-outlined text-danger text-[18px]" data-icon="error" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
                        <span className="bg-secondary-fixed-dim text-on-secondary-container px-1.5 py-0.5 rounded font-label-caps text-[9px] uppercase font-semibold">{t("flagged").toUpperCase()}</span>
                      </>
                    )}
                    {isReview && (
                      <>
                        <span className="material-symbols-outlined text-warning text-[18px]" data-icon="warning" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
                        <span className="bg-tertiary-fixed-dim text-on-tertiary-container px-1.5 py-0.5 rounded font-label-caps text-[9px] uppercase font-semibold">{t("review").toUpperCase()}</span>
                      </>
                    )}
                    {isPending && (
                      <>
                        <span className="material-symbols-outlined text-primary text-[18px]" data-icon="pending" style={{ fontVariationSettings: "'FILL' 1" }}>pending</span>
                        <span className="bg-surface-container-high text-on-surface-variant px-1.5 py-0.5 rounded font-label-caps text-[9px] uppercase font-semibold">{t("inProgress").toUpperCase()}</span>
                      </>
                    )}
                    {isApproved && (
                      <>
                        <span className="material-symbols-outlined text-success text-[18px]" data-icon="check_circle" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                        <span className="bg-green-100 text-success px-1.5 py-0.5 rounded font-label-caps text-[9px] uppercase font-semibold">{t("autoApproved").toUpperCase()}</span>
                      </>
                    )}
                  </div>
                  <span className="font-technical-data text-technical-data text-on-surface-variant">{item.eventId}</span>
                </div>

                <div>
                  <h3 className="font-body-md text-body-md font-medium text-on-surface mb-1 line-clamp-2">
                    {t(item.activityDescription) || item.activityDescription}
                  </h3>
                  <div className="inline-block bg-surface-container-high text-on-surface-variant px-2 py-0.5 rounded text-[11px]">
                    {t(item.discipline?.toLowerCase()) || item.discipline}
                  </div>
                </div>

                <div className="mt-auto pt-2 border-t border-border-standard flex justify-between items-center text-on-surface-variant font-body-sm text-[11px]">
                  <div className="flex items-center gap-1">
                    {getInputIcon(item.inputFormat)}
                    <span className="capitalize">{t(item.inputFormat)}</span>
                  </div>
                  <span>{item.timestamp}</span>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
};
