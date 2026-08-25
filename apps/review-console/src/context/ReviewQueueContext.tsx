import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import type { QueueItem, NewReportInput, CreateActivityInput, StatusType, DisciplineType, InputFormatType, ScheduleCandidate } from "../types";
import { initialQueueItems } from '../data/mockData';
import { ingestText, matchEvent, writebackApprove, writebackReject, addScheduleActivity } from '../lib/api';

interface ToastState {
  message: string;
  auditId?: string;
  type?: 'success' | 'info' | 'error';
}

interface ReviewQueueContextType {
  items: QueueItem[];
  filteredItems: QueueItem[];
  activeDisciplineFilter: DisciplineType | null;
  setActiveDisciplineFilter: (discipline: DisciplineType | null) => void;
  activeStatusFilter: string | null;
  setActiveStatusFilter: (status: string | null) => void;
  activeInputFormatFilter: InputFormatType | null;
  setActiveInputFormatFilter: (format: InputFormatType | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
  priorityFilter: string;
  setPriorityFilter: (priority: string) => void;
  viewMode: 'table' | 'grid';
  setViewMode: (mode: 'table' | 'grid') => void;

  // Counts
  counts: {
    total: number;
    autoApproved: number;
    review: number;
    flagged: number;
    inProgress: number;
  };

  // Modals & Active State
  isNewReportModalOpen: boolean;
  setIsNewReportModalOpen: (open: boolean) => void;
  isCreateActivityModalOpen: boolean;
  setIsCreateActivityModalOpen: (open: boolean) => void;
  isExportModalOpen: boolean;
  setIsExportModalOpen: (open: boolean) => void;
  isScheduleModalOpen: boolean;
  setIsScheduleModalOpen: (open: boolean) => void;
  activeScheduleItem: QueueItem | null;
  setActiveScheduleItem: (item: QueueItem | null) => void;
  selectedCandidate: ScheduleCandidate | null;
  setSelectedCandidate: (candidate: ScheduleCandidate | null) => void;



  // Accessibility / Header States
  isHighContrast: boolean;
  toggleHighContrast: () => void;
  isTextEnlarged: boolean;
  toggleTextEnlarged: () => void;
  language: 'EN' | 'HI';
  toggleLanguage: () => void;
  isMobileSidebarOpen: boolean;
  setIsMobileSidebarOpen: (open: boolean) => void;
  toggleMobileSidebar: () => void;

  // Toast
  toast: ToastState | null;
  showToast: (message: string, auditId?: string, type?: 'success' | 'info' | 'error') => void;
  closeToast: () => void;

  // Actions
  getItemById: (id: string) => QueueItem | undefined;
  approveItem: (itemId: string, candidateId?: string) => void;
  confirmScheduleMatch: (itemId: string, candidate: ScheduleCandidate) => void;
  discardItem: (itemId: string) => void;
  addNewReport: (report: NewReportInput) => void;
  createMasterActivity: (activity: CreateActivityInput) => void;
  exportData: (format: 'CSV' | 'Excel' | 'PDF', columns: string[]) => void;
}

const ReviewQueueContext = createContext<ReviewQueueContextType | undefined>(undefined);

export const ReviewQueueProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<QueueItem[]>(initialQueueItems);
  const [activeDisciplineFilter, setActiveDisciplineFilter] = useState<DisciplineType | null>(null);
  const [activeStatusFilter, setActiveStatusFilter] = useState<string | null>(null);
  const [activeInputFormatFilter, setActiveInputFormatFilter] = useState<InputFormatType | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Modals
  const [isNewReportModalOpen, setIsNewReportModalOpen] = useState(false);
  const [isCreateActivityModalOpen, setIsCreateActivityModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [activeScheduleItem, setActiveScheduleItem] = useState<QueueItem | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<ScheduleCandidate | null>(null);



  // Accessibility
  const [isHighContrast, setIsHighContrast] = useState(false);
  const [isTextEnlarged, setIsTextEnlarged] = useState(false);
  const [language, setLanguage] = useState<'EN' | 'HI'>('EN');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const toggleMobileSidebar = useCallback(() => {
    setIsMobileSidebarOpen(prev => !prev);
  }, []);

  // Toast
  const [toast, setToast] = useState<ToastState | null>(null);

  const toggleHighContrast = useCallback(() => {
    setIsHighContrast(prev => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add('high-contrast');
      } else {
        document.documentElement.classList.remove('high-contrast');
      }
      return next;
    });
  }, []);

  const toggleTextEnlarged = useCallback(() => {
    setIsTextEnlarged(prev => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add('text-large');
      } else {
        document.documentElement.classList.remove('text-large');
      }
      return next;
    });
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguage(prev => (prev === 'EN' ? 'HI' : 'EN'));
  }, []);

  const showToast = useCallback((message: string, auditId?: string, type: 'success' | 'info' | 'error' = 'success') => {
    const generatedAudit = auditId || Math.random().toString(36).substring(2, 10).toUpperCase();
    setToast({ message, auditId: generatedAudit, type });
    setTimeout(() => {
      setToast(prev => (prev?.auditId === generatedAudit ? null : prev));
    }, 4500);
  }, []);

  const closeToast = useCallback(() => {
    setToast(null);
  }, []);

  const getItemById = useCallback((id: string) => {
    return items.find(item => item.id === id || item.eventId === id);
  }, [items]);

  const approveItem = useCallback((itemId: string, candidateId?: string) => {
    setItems(prevItems =>
      prevItems.map(item => {
        if (item.id === itemId || item.eventId === itemId) {
          return {
            ...item,
            status: 'auto_approved' as StatusType,
            statusLabel: 'Auto-Approved',
            linkedActivity: candidateId || item.candidates[0]?.id || 'L6-PIP-4092'
          };
        }
        return item;
      })
    );
    showToast('Record approved successfully', '88A2B9C1', 'success');
  }, [showToast]);

  const confirmScheduleMatch = useCallback((itemId: string, candidate: ScheduleCandidate) => {
    setItems(prevItems =>
      prevItems.map(item => {
        if (item.id === itemId || item.eventId === itemId) {
          // Fire-and-forget writeback to backend
          writebackApprove({
            activity_id: candidate.id,
            discipline: item.discipline,
            event_date: item.date || new Date().toISOString().split('T')[0],
            confidence_score: candidate.matchScore,
            confidence_band: candidate.matchScore >= 0.8 ? 'high' : candidate.matchScore >= 0.5 ? 'medium' : 'low',
            was_ambiguous: item.candidates.length > 1,
            source_document: item.formatTabs?.dprText ? 'dpr_input' : 'review_console',
            source_excerpt: item.sourceText || item.activityDescription,
            approved_by: 'S. Gogoi',
          }).catch(err => console.warn('Writeback approve failed (offline?):', err));

          return {
            ...item,
            status: 'auto_approved' as StatusType,
            statusLabel: 'Approved',
            linkedActivity: candidate.id,
            confidenceScore: Math.round(candidate.matchScore * 100)
          };
        }
        return item;
      })
    );
    const auditId = Math.random().toString(36).substring(2, 10).toUpperCase();
    showToast('Schedule matched & saved', auditId, 'success');
  }, [showToast]);

  const discardItem = useCallback((itemId: string) => {
    const item = items.find(i => i.id === itemId || i.eventId === itemId);
    if (item) {
      writebackReject({
        activity_id: item.linkedActivity || item.candidates[0]?.id || 'DISCARDED',
        discipline: item.discipline,
        event_date: item.date || new Date().toISOString().split('T')[0],
        confidence_score: item.confidenceScore / 100,
        confidence_band: item.confidenceScore >= 80 ? 'high' : item.confidenceScore >= 50 ? 'medium' : 'low',
        was_ambiguous: item.candidates.length > 1,
        source_document: 'review_console',
        source_excerpt: item.sourceText || item.activityDescription,
        approved_by: 'S. Gogoi',
      }).catch(err => console.warn('Writeback reject failed (offline?):', err));
    }
    setItems(prevItems => prevItems.filter(i => i.id !== itemId && i.eventId !== itemId));
    showToast('Record dismissed from queue', undefined, 'info');
  }, [items, showToast]);



  const addNewReport = useCallback((newReport: NewReportInput) => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const eventId = `EV-${randomNum}A`;
    const recordId = `OIL-2026-X${randomNum.toString().substring(0, 3)}`;
    const today = new Date().toISOString().split('T')[0];

    // Build a base item immediately so the UI is responsive
    const baseItem: QueueItem = {
      id: recordId,
      eventId: eventId,
      status: 'review',
      statusLabel: 'Review',
      activityPhrase: newReport.activityPhrase,
      activityDescription: newReport.activityPhrase,
      discipline: newReport.discipline || 'Piping',
      inputFormat: 'manual',
      timestamp: 'Just now',
      date: today,
      confidenceScore: 0,
      tagId: newReport.tagId || 'N/A',
      contractor: newReport.contractor || 'Internal Field Team',
      exceptionNote: newReport.exceptionNote,
      actualStart: newReport.actualStart,
      actualFinish: newReport.actualFinish,
      progress: newReport.progress || 0,
      sourceText: newReport.activityPhrase,
      priority: 'Medium',
      formatTabs: { dprText: newReport.activityPhrase },
      extractedFields: [
        { fieldName: 'Activity', extractedValue: newReport.activityPhrase, systemMapping: '-' },
        { fieldName: 'Discipline', extractedValue: newReport.discipline, systemMapping: newReport.discipline },
        { fieldName: 'Tag ID', extractedValue: newReport.tagId || 'N/A', systemMapping: newReport.tagId || '-' },
        { fieldName: 'Progress', extractedValue: `${newReport.progress}%`, systemMapping: `${newReport.progress}%`, progressPercent: newReport.progress }
      ],
      candidates: []
    };

    setItems(prev => [baseItem, ...prev]);
    showToast('Processing report through AI engine…', undefined, 'info');

    // Async: call ingest → match → update item with real candidates
    (async () => {
      try {
        const ingestRes = await ingestText(newReport.activityPhrase, 'review_console_new_report');
        const event = ingestRes.events[0];
        if (!event) throw new Error('No events extracted');

        const matchRes = await matchEvent(event);
        const realCandidates: ScheduleCandidate[] = matchRes.candidates.map(c => ({
          id: c.activity_id,
          wbsPath: `Primavera Schedule / ${c.activity_id}`,
          discipline: newReport.discipline,
          title: c.activity_name,
          plannedStart: today,
          plannedFinish: today,
          durationDays: 0,
          responsibility: 'Field Engineering',
          resources: [],
          matchScore: c.score,
          isRecommended: c.activity_id === matchRes.top_activity_id,
          rationale: c.rationale,
        }));

        setItems(prev => prev.map(it => it.id === recordId ? {
          ...it,
          confidenceScore: Math.round(matchRes.confidence_score * 100),
          candidates: realCandidates,
          tagId: event.tag_or_line_id || newReport.tagId || 'N/A',
          discipline: (event.discipline as DisciplineType) || newReport.discipline,
          linkedActivity: matchRes.top_activity_id || undefined,
          status: matchRes.confidence_score >= 0.8 ? 'auto_approved' : 'review',
          statusLabel: matchRes.confidence_score >= 0.8 ? 'Auto-Approved' : 'Review',
        } : it));
        showToast('Report processed & matched to schedule', undefined, 'success');
      } catch (err) {
        console.warn('AI pipeline failed, keeping item as manual review:', err);
        // Update with a fallback candidate
        setItems(prev => prev.map(it => it.id === recordId ? {
          ...it,
          confidenceScore: 60,
          candidates: [{
            id: `L6-${newReport.discipline.substring(0, 3).toUpperCase()}-${randomNum}`,
            wbsPath: `01.05.03 | ${newReport.discipline} | Numaligarh`,
            discipline: newReport.discipline,
            title: newReport.activityPhrase,
            plannedStart: newReport.actualStart || today,
            plannedFinish: newReport.actualFinish || today,
            durationDays: 14,
            responsibility: newReport.contractor || 'Field Engineering',
            resources: ['Crew (4)'],
            matchScore: 0.60,
            isRecommended: true,
            rationale: 'Fallback: backend unavailable. Manual review required.',
          }],
        } : it));
        showToast('Backend offline — report saved for manual review', undefined, 'info');
      }
    })();
  }, [showToast]);

  const createMasterActivity = useCallback((activity: CreateActivityInput) => {
    const randomId = `L6-${activity.discipline.substring(0, 3).toUpperCase()}-${Math.floor(4000 + Math.random() * 1000)}`;
    const newCandidate: ScheduleCandidate = {
      id: randomId,
      wbsPath: activity.wbsPath,
      discipline: activity.discipline,
      title: activity.activityName,
      plannedStart: activity.plannedStart || '2023-12-01',
      plannedFinish: activity.plannedFinish || '2023-12-15',
      durationDays: 14,
      responsibility: activity.responsibleTeam || 'Master Scheduling Crew',
      resources: activity.resources,
      matchScore: 0.99,
      isRecommended: true,
      rationale: 'Direct master schedule node creation.'
    };

    // Push to FAISS vector store so future matches can find it
    addScheduleActivity({
      activity_id: randomId,
      activity_name: activity.activityName,
      discipline: activity.discipline.toLowerCase(),
      tag: activity.wbsPath,
      wbs_path: activity.wbsPath,
      planned_start: activity.plannedStart || '2023-12-01',
      planned_finish: activity.plannedFinish || '2023-12-15',
    }).catch(err => console.warn('Could not push activity to schedule store (offline?):', err));

    // If there is an active item, attach candidate
    if (activeScheduleItem) {
      setItems(prev =>
        prev.map(it => {
          if (it.id === activeScheduleItem.id) {
            return {
              ...it,
              candidates: [newCandidate, ...it.candidates]
            };
          }
          return it;
        })
      );
      setSelectedCandidate(newCandidate);
    }

    showToast(`Master activity ${randomId} created`, undefined, 'success');
  }, [activeScheduleItem, showToast]);

  const exportData = useCallback((format: 'CSV' | 'Excel' | 'PDF', columns: string[]) => {
    const rows = items.map(item => {
      const data: Record<string, string | number> = {};
      if (columns.includes('Event ID')) data['Event ID'] = item.eventId;
      if (columns.includes('Activity')) data['Activity'] = item.activityDescription;
      if (columns.includes('Discipline')) data['Discipline'] = item.discipline;
      if (columns.includes('Confidence')) data['Confidence'] = `${item.confidenceScore}%`;
      if (columns.includes('Status')) data['Status'] = item.statusLabel;
      if (columns.includes('Timestamp')) data['Timestamp'] = item.timestamp;
      if (columns.includes('Linked Activity')) data['Linked Activity'] = item.linkedActivity || 'Unlinked';
      return data;
    });

    if (format === 'CSV') {
      const headers = Object.keys(rows[0] || {}).join(',');
      const csvContent = "data:text/csv;charset=utf-8," + 
        [headers, ...rows.map(e => Object.values(e).map(val => `"${val}"`).join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `kadam_review_queue_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // Simulate file download for Excel/PDF
      const link = document.createElement('a');
      link.setAttribute('href', 'data:text/plain;charset=utf-8,Kadam Export Data');
      link.setAttribute('download', `kadam_review_queue_${new Date().toISOString().slice(0,10)}.${format.toLowerCase() === 'excel' ? 'xlsx' : 'pdf'}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    showToast(`Report exported as ${format} successfully`, undefined, 'success');
  }, [items, showToast]);

  // Derived filtered items
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // Discipline filter
      if (activeDisciplineFilter && item.discipline.toLowerCase() !== activeDisciplineFilter.toLowerCase()) {
        return false;
      }
      // Status filter
      if (activeStatusFilter && activeStatusFilter !== 'all') {
        if (activeStatusFilter === 'auto_approved' && item.status !== 'auto_approved') return false;
        if (activeStatusFilter === 'review' && item.status !== 'review') return false;
        if (activeStatusFilter === 'flagged' && item.status !== 'flagged') return false;
        if (activeStatusFilter === 'in_progress' && item.status !== 'in_progress') return false;
      }
      // Input format filter
      if (activeInputFormatFilter && item.inputFormat !== activeInputFormatFilter) {
        return false;
      }
      // Priority filter
      if (priorityFilter !== 'all' && item.priority !== priorityFilter) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesEventId = item.eventId.toLowerCase().includes(q);
        const matchesId = item.id.toLowerCase().includes(q);
        const matchesDesc = item.activityDescription.toLowerCase().includes(q);
        const matchesPhrase = item.activityPhrase.toLowerCase().includes(q);
        const matchesTag = item.tagId?.toLowerCase().includes(q);
        const matchesDiscipline = item.discipline.toLowerCase().includes(q);
        if (!matchesEventId && !matchesId && !matchesDesc && !matchesPhrase && !matchesTag && !matchesDiscipline) {
          return false;
        }
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === 'newest') return b.id.localeCompare(a.id);
      if (sortBy === 'oldest') return a.id.localeCompare(b.id);
      if (sortBy === 'confidence') return b.confidenceScore - a.confidenceScore;
      if (sortBy === 'priority') {
        const pOrder: Record<string, number> = { High: 3, Medium: 2, Low: 1 };
        return (pOrder[b.priority || 'Medium'] || 2) - (pOrder[a.priority || 'Medium'] || 2);
      }
      return 0;
    });
  }, [items, activeDisciplineFilter, activeStatusFilter, activeInputFormatFilter, priorityFilter, searchQuery, sortBy]);

  // Counts for badge chips
  const counts = useMemo(() => {
    return {
      total: items.length,
      autoApproved: items.filter(i => i.status === 'auto_approved').length,
      review: items.filter(i => i.status === 'review').length,
      flagged: items.filter(i => i.status === 'flagged').length,
      inProgress: items.filter(i => i.status === 'in_progress' || i.status === 'pending').length
    };
  }, [items]);

  return (
    <ReviewQueueContext.Provider
      value={{
        items,
        filteredItems,
        activeDisciplineFilter,
        setActiveDisciplineFilter,
        activeStatusFilter,
        setActiveStatusFilter,
        activeInputFormatFilter,
        setActiveInputFormatFilter,
        searchQuery,
        setSearchQuery,
        sortBy,
        setSortBy,
        priorityFilter,
        setPriorityFilter,
        viewMode,
        setViewMode,
        counts,
        isNewReportModalOpen,
        setIsNewReportModalOpen,
        isCreateActivityModalOpen,
        setIsCreateActivityModalOpen,
        isExportModalOpen,
        setIsExportModalOpen,
        isScheduleModalOpen,
        setIsScheduleModalOpen,
        activeScheduleItem,
        setActiveScheduleItem,
        selectedCandidate,
        setSelectedCandidate,
        isHighContrast,
        toggleHighContrast,
        isTextEnlarged,
        toggleTextEnlarged,
        language,
        toggleLanguage,
        isMobileSidebarOpen,
        setIsMobileSidebarOpen,
        toggleMobileSidebar,
        toast,
        showToast,
        closeToast,
        getItemById,
        approveItem,
        confirmScheduleMatch,
        discardItem,
        addNewReport,
        createMasterActivity,
        exportData
      }}
    >
      {children}
    </ReviewQueueContext.Provider>
  );
};

export const useReviewQueue = () => {
  const context = useContext(ReviewQueueContext);
  if (!context) {
    throw new Error('useReviewQueue must be used within a ReviewQueueProvider');
  }
  return context;
};
