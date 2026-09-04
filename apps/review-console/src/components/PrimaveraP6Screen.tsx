import React, { useEffect, useState } from 'react';
import { Database, CheckCircle2, AlertTriangle, PauseCircle, Download, Search, ArrowRight, RefreshCw } from 'lucide-react';
import { useReviewQueue } from '../context/ReviewQueueContext';
import { getScheduleActivities, getAuditHistory, type ScheduleActivity, type ApprovalPayload } from '../lib/api';

interface ScheduleRow extends ScheduleActivity {
  status: 'Completed' | 'Delayed' | 'Not Started';
  progress: number;
  delayReason: string | null;
}

const DISCIPLINE_STYLES: Record<string, string> = {
  piping: 'bg-teal-100 text-teal-900 border-teal-300 dark:bg-teal-950 dark:text-teal-200 dark:border-teal-800',
  civil: 'bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950 dark:text-blue-200 dark:border-blue-800',
  electrical: 'bg-amber-100 text-amber-950 border-amber-300 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-800',
  instrumentation: 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-800',
  static_rotating: 'bg-purple-100 text-purple-900 border-purple-300 dark:bg-purple-950 dark:text-purple-200 dark:border-purple-800',
  hse: 'bg-rose-100 text-rose-900 border-rose-300 dark:bg-rose-950 dark:text-rose-200 dark:border-rose-800',
};

export const PrimaveraP6Screen: React.FC = () => {
  const { isDarkMode } = useReviewQueue();
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [rows, setRows] = useState<ScheduleRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [activities, history] = await Promise.all([
        getScheduleActivities(),
        getAuditHistory().catch(() => [] as ApprovalPayload[]),
      ]);

      // Cross-reference the real schedule (matching engine) with the real
      // approval history (writeback DB) to derive each activity's status.
      // There is no "in progress" signal anywhere in the pipeline yet — an
      // activity is either matched-and-approved or it isn't — so status is
      // deliberately binary plus a delay flag, not a fabricated percentage.
      const byActivity = new Map<string, ApprovalPayload>();
      for (const h of history) {
        if (h.status === 'approved' && !byActivity.has(h.activity_id)) {
          byActivity.set(h.activity_id, h);
        }
      }

      const merged: ScheduleRow[] = activities.map((act) => {
        const approval = byActivity.get(act.activity_id);
        if (approval?.delay_reason) {
          return { ...act, status: 'Delayed', progress: 60, delayReason: approval.delay_reason };
        }
        if (approval) {
          return { ...act, status: 'Completed', progress: 100, delayReason: null };
        }
        return { ...act, status: 'Not Started', progress: 0, delayReason: null };
      });

      setRows(merged);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load schedule');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const disciplines = Array.from(new Set(rows.map((r) => r.discipline))).sort();

  const filteredRows = rows.filter((row) => {
    const matchesDiscipline = selectedDiscipline === 'ALL' || row.discipline === selectedDiscipline;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      q === '' ||
      row.activity_id.toLowerCase().includes(q) ||
      row.activity_name.toLowerCase().includes(q) ||
      row.wbs_path.toLowerCase().includes(q);
    return matchesDiscipline && matchesSearch;
  });

  const totalCount = rows.length;
  const completedCount = rows.filter((r) => r.status === 'Completed').length;
  const delayedCount = rows.filter((r) => r.status === 'Delayed').length;
  const notStartedCount = rows.filter((r) => r.status === 'Not Started').length;

  const card = (label: string, value: React.ReactNode, valueClass: string) => (
    <div
      style={{ backgroundColor: isDarkMode ? '#0f172a' : '#ffffff', borderColor: isDarkMode ? '#1e293b' : '#e2e8f0' }}
      className="border rounded-xl p-4 flex flex-col gap-1 shadow-xs transition-colors"
    >
      <span className="text-[10.5px] font-black tracking-wider uppercase text-slate-500 dark:text-slate-400">{label}</span>
      <span className={`text-3xl font-black ${valueClass}`}>{value}</span>
    </div>
  );

  return (
    <main
      style={{ backgroundColor: isDarkMode ? '#020617' : '#f8fafc', color: isDarkMode ? '#f8fafc' : '#0f172a' }}
      className="lg:ml-[240px] ml-0 mt-[56px] flex-1 overflow-y-auto p-4 lg:p-6 min-h-[calc(100vh-56px)] flex flex-col gap-6 transition-colors"
    >
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/20">
            <Database className="w-6 h-6" />
          </div>
          <h2 style={{ color: isDarkMode ? '#ffffff' : '#0f172a' }} className="text-xl sm:text-2xl font-black tracking-tight">
            Schedule (Matching Engine Sample Data)
          </h2>
          <span className="bg-slate-500/15 text-slate-700 dark:text-slate-300 border border-slate-500/30 px-3.5 py-1.5 rounded-full font-mono text-xs font-black flex items-center gap-2 shadow-xs whitespace-nowrap">
            Not connected to a real Primavera P6 instance &mdash; sample dataset used for matching
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            style={{ backgroundColor: isDarkMode ? '#0f172a' : '#ffffff', color: isDarkMode ? '#f8fafc' : '#0f172a', borderColor: isDarkMode ? '#334155' : '#cbd5e1' }}
            className="border rounded-lg px-4 py-2 text-xs font-black flex items-center gap-2 transition-all cursor-pointer shadow-xs"
          >
            <RefreshCw className={`w-4 h-4 text-blue-600 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => window.print()}
            style={{ backgroundColor: isDarkMode ? '#0f172a' : '#ffffff', color: isDarkMode ? '#f8fafc' : '#0f172a', borderColor: isDarkMode ? '#334155' : '#cbd5e1' }}
            className="border rounded-lg px-4 py-2 text-xs font-black flex items-center gap-2 transition-all cursor-pointer shadow-xs"
          >
            <Download className="w-4 h-4 text-blue-600" />
            Export PDF
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-sm font-bold">
          {error} &mdash; is the matching service (port 8002) running?
        </div>
      )}

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {card('TOTAL SCHEDULE ACTIVITIES', totalCount, 'text-blue-600 dark:text-sky-400')}
        {card('COMPLETED (APPROVED)', completedCount, 'text-emerald-600 dark:text-emerald-400')}
        {card('NOT STARTED', notStartedCount, 'text-slate-500 dark:text-slate-400')}
        {card('DELAYED', delayedCount, 'text-red-600 dark:text-red-500')}
      </div>

      {/* Activity Table Section */}
      <div
        style={{ backgroundColor: isDarkMode ? '#0f172a' : '#ffffff', borderColor: isDarkMode ? '#1e293b' : '#e2e8f0' }}
        className="border rounded-xl flex flex-col shadow-xs overflow-hidden"
      >
        {/* Toolbar */}
        <div
          style={{ backgroundColor: isDarkMode ? '#020617' : '#f1f5f9', borderColor: isDarkMode ? '#1e293b' : '#e2e8f0' }}
          className="p-4 border-b flex flex-wrap items-center gap-4"
        >
          <span style={{ color: isDarkMode ? '#94a3b8' : '#334155' }} className="text-xs font-black uppercase tracking-wider">
            DISCIPLINE:
          </span>
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <button
              onClick={() => setSelectedDiscipline('ALL')}
              className={`px-3 py-1 rounded-md font-extrabold transition-all cursor-pointer ${
                selectedDiscipline === 'ALL'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : isDarkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-white border border-slate-300 text-slate-800 hover:bg-slate-100'
              }`}
            >
              ALL
            </button>
            {disciplines.map((d) => (
              <button
                key={d}
                onClick={() => setSelectedDiscipline(d)}
                className={`px-3 py-1 rounded-md font-extrabold uppercase transition-all cursor-pointer ${
                  selectedDiscipline === d
                    ? 'bg-blue-600 text-white shadow-xs'
                    : isDarkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-white border border-slate-300 text-slate-800 hover:bg-slate-100'
                }`}
              >
                {d.replace('_', ' ')}
              </button>
            ))}
          </div>

          <div className="ml-auto relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Activity ID or name..."
              style={{ backgroundColor: isDarkMode ? '#0f172a' : '#ffffff', color: isDarkMode ? '#f8fafc' : '#0f172a', borderColor: isDarkMode ? '#334155' : '#cbd5e1' }}
              className="w-full pl-9 pr-3 py-1.5 border rounded-md text-xs font-bold outline-none transition-colors"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[900px]">
            <thead
              style={{ backgroundColor: isDarkMode ? '#020617' : '#e2e8f0', color: isDarkMode ? '#cbd5e1' : '#0f172a' }}
              className="border-b border-slate-300 dark:border-slate-800"
            >
              <tr>
                <th className="py-3.5 px-4 font-black uppercase tracking-wider w-36">Activity ID</th>
                <th className="py-3.5 px-4 font-black uppercase tracking-wider min-w-[280px]">Activity Name</th>
                <th className="py-3.5 px-4 font-black uppercase tracking-wider min-w-[200px]">WBS Path</th>
                <th className="py-3.5 px-4 font-black uppercase tracking-wider w-32">Discipline</th>
                <th className="py-3.5 px-4 font-black uppercase tracking-wider w-32">Status</th>
                <th className="py-3.5 px-4 font-black uppercase tracking-wider w-52">Planned Dates</th>
                <th className="py-3.5 px-4 font-black uppercase tracking-wider w-32">Progress</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800' : 'divide-slate-200'}`}>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">Loading schedule...</td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">No activities match.</td>
                </tr>
              ) : (
                filteredRows.map((row) => (
                  <tr key={row.activity_id} style={{ backgroundColor: isDarkMode ? '#0f172a' : '#ffffff' }} className="transition-colors hover:bg-blue-50/60 dark:hover:bg-slate-800/60">
                    <td style={{ color: isDarkMode ? '#f8fafc' : '#0f172a' }} className="py-3.5 px-4 font-mono font-black whitespace-nowrap text-sm">
                      {row.activity_id}
                    </td>
                    <td style={{ color: isDarkMode ? '#ffffff' : '#0f172a' }} className="py-3.5 px-4 font-black whitespace-normal text-sm leading-snug">
                      {row.activity_name}
                      {row.delayReason && (
                        <div className="text-[11px] font-semibold text-red-500 mt-0.5">{row.delayReason}</div>
                      )}
                    </td>
                    <td style={{ color: isDarkMode ? '#cbd5e1' : '#1e293b' }} className="py-3.5 px-4 text-xs font-bold">
                      {row.wbs_path}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded text-xs font-black border ${DISCIPLINE_STYLES[row.discipline] || DISCIPLINE_STYLES.civil}`}>
                        {row.discipline.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {row.status === 'Completed' ? (
                        <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-black">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Completed
                        </span>
                      ) : row.status === 'Delayed' ? (
                        <span className="flex items-center gap-1.5 text-red-600 dark:text-red-400 text-xs font-black">
                          <AlertTriangle className="w-4 h-4 text-red-600" /> Delayed
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs font-bold">
                          <PauseCircle className="w-4 h-4 text-slate-400" /> Not Started
                        </span>
                      )}
                    </td>
                    <td style={{ color: isDarkMode ? '#cbd5e1' : '#1e293b' }} className="py-3.5 px-4 font-mono text-[11.5px] font-black whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span>{row.planned_start}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                        <span>{row.planned_finish}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${row.status === 'Completed' ? 'bg-emerald-500' : row.status === 'Delayed' ? 'bg-red-500' : 'bg-amber-500'}`}
                            style={{ width: `${row.progress}%` }}
                          />
                        </div>
                        <span style={{ color: row.status === 'Delayed' ? '#dc2626' : (isDarkMode ? '#ffffff' : '#0f172a') }} className="font-mono text-xs font-black min-w-[36px]">
                          {row.progress}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div
          style={{ backgroundColor: isDarkMode ? '#020617' : '#f1f5f9', borderColor: isDarkMode ? '#1e293b' : '#e2e8f0', color: isDarkMode ? '#94a3b8' : '#475569' }}
          className="p-3.5 border-t flex justify-between items-center text-xs font-bold"
        >
          <span>Showing {filteredRows.length} of {totalCount} activities</span>
        </div>
      </div>
    </main>
  );
};
