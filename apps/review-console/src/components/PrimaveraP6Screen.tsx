import React, { useState } from 'react';
import { Database, Layers, CheckCircle2, Clock, AlertTriangle, Filter, ChevronRight } from 'lucide-react';
import { useReviewQueue } from '../context/ReviewQueueContext';

export const PrimaveraP6Screen: React.FC = () => {
  const { isDarkMode, language } = useReviewQueue();
  const [selectedLevel, setSelectedLevel] = useState<string>("ALL");
  const isHi = language === 'HI';

  // Master WBS level summary data
  const wbsSummary = [
    { level: "L1", label: isHi ? "?????? / ????????? ??????" : "Plant / Project Master", total: 1, finished: 0, inProgress: 1, delayed: 0, pct: 0 },
    { level: "L2", label: isHi ? "????? ????" : "Unit Level", total: 4, finished: 2, inProgress: 2, delayed: 0, pct: 50 },
    { level: "L3", label: isHi ? "?????? ?????" : "System Package Level", total: 18, finished: 12, inProgress: 5, delayed: 1, pct: 67 },
    { level: "L4", label: isHi ? "??-?????? / ???????" : "Sub-System / Module Level", total: 45, finished: 31, inProgress: 11, delayed: 3, pct: 69 },
    { level: "L5", label: isHi ? "???? ?????" : "Work Package Level", total: 120, finished: 84, inProgress: 28, delayed: 8, pct: 70 },
    { level: "L6", label: isHi ? "?????? ????? ???" : "Field Activity Task Node", total: 320, finished: 196, inProgress: 98, delayed: 26, pct: 61 },
  ];

  // Mock list of master schedule activities from L1 to L6
  const masterActivities = [
    { id: "L1-OIL-HCU3", level: "L1", name: isHi ? "????????????? ?????-3 ??????? ????????" : "Hydrocracker Expansion Unit-3 Project", status: "In Progress", start: "2025-01-01", finish: "2026-12-31", progress: 64, discipline: "Project" },
    { id: "L2-UNIT-01", level: "L2", name: isHi ? "???????? ???????? ?????" : "Refinery Substation Block 01", status: "Finished", start: "2025-02-01", finish: "2025-11-30", progress: 100, discipline: "Electrical" },
    { id: "L2-UNIT-02", level: "L2", name: isHi ? "?????? ???? ???? ??? ??????????????" : "Cooling Water Header & Distribution", status: "In Progress", start: "2025-03-15", finish: "2026-06-30", progress: 55, discipline: "Piping" },
    { id: "L3-SYS-104", level: "L3", name: isHi ? "???????? ???????????? ????????? ????????" : "Substation Transformer Foundation Package", status: "Finished", start: "2025-04-01", finish: "2025-09-15", progress: 100, discipline: "Civil" },
    { id: "L3-SYS-202", level: "L3", name: isHi ? "24-??? ????? ?????? ???? ??????? ???" : "24-Inch Main Cooling Water Piping Loop", status: "In Progress", start: "2025-05-10", finish: "2026-04-20", progress: 62, discipline: "Piping" },
    { id: "L4-PIP-402", level: "L4", name: isHi ? "?????? ???? 24-CW ????? ???????" : "Cooling Line 24-CW Valve Erection", status: "In Progress", start: "2026-08-20", finish: "2026-09-05", progress: 40, discipline: "Piping" },
    { id: "L4-CIV-104", level: "L4", name: isHi ? "???????? ???????????? ??? ??????? ?????" : "Substation Transformer Pit Concrete Pouring", status: "Finished", start: "2026-08-01", finish: "2026-08-25", progress: 100, discipline: "Civil" },
    { id: "L5-ELE-205", level: "L5", name: isHi ? "?????? 4B ???? ???? ??????????" : "Sector 4B Cable Tray Erection & Pulling", status: "In Progress", start: "2026-08-10", finish: "2026-09-10", progress: 60, discipline: "Electrical" },
    { id: "L5-CIV-8840", level: "L5", name: isHi ? "???????????? ??? ????????? ?????????" : "Transformer Pit Foundation Grouting", status: "Finished", start: "2026-08-15", finish: "2026-08-30", progress: 100, discipline: "Civil" },
    { id: "L6-HSE-301", level: "L6", name: isHi ? "????????? ??????? ???? ?? ??-???????????" : "Scaffold Safety Audit & Recertification", status: "Delayed", start: "2026-08-28", finish: "2026-08-31", progress: 20, discipline: "HSE" },
    { id: "L6-INS-112", level: "L6", name: isHi ? "?????? ?????? ?????????? ??????????" : "Wellhead Pressure Transmitters Calibration", status: "Finished", start: "2026-08-01", finish: "2026-08-29", progress: 100, discipline: "Instrumentation" },
  ];

  const filteredActivities = masterActivities.filter(act => {
    if (selectedLevel === "ALL") return true;
    return act.level === selectedLevel;
  });

  return (
    <main className={`lg:ml-[240px] ml-0 mt-12 w-full lg:w-[calc(100%-240px)] min-h-[calc(100vh-3rem)] p-4 lg:p-6 flex flex-col gap-6 transition-colors ${
      isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-[#f8fafc] text-slate-900'
    }`}>
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 font-medium mb-1">
            <span>{isHi ? "???????????" : "Projects"}</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-blue-600 font-bold">{isHi ? "????????????? ??????? ?????-3" : "Hydrocracker Expansion Unit-3"}</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2.5">
            <Database className="w-7 h-7 text-blue-600" />
            {isHi ? "?????????? P6 ?????? ??????? (L1 ?? L6)" : "Primavera P6 Master Schedule (L1 to L6)"}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            {isHi ? "???? ????? ?????????? P6 ?????????? ??????????  WBS ????????? ?????????" : "Live Oracle Primavera P6 Enterprise Integration  Master Schedule WBS Structure"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-extrabold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Live P6 API (PRM-OIL-2026-HCU3)
          </span>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'}`}>
          <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">{isHi ? "??? ?????? ?????" : "Total Master WBS Nodes"}</div>
          <div className="text-3xl font-black mt-1 text-blue-600 dark:text-sky-400">508</div>
          <div className="text-xs text-slate-400 font-medium mt-1">L1 ({isHi ? "?????????" : "Project"}) {isHi ? "??" : "to"} L6 ({isHi ? "?????? ?????" : "Field Activity"})</div>
        </div>

        <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'}`}>
          <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">{isHi ? "????? ??? ?? ?????" : "Finished Nodes"}</div>
          <div className="text-3xl font-black mt-1 text-emerald-500">325</div>
          <div className="text-xs text-emerald-600 font-bold mt-1">64% {isHi ? "??? ??????? ?????" : "Total Schedule Completed"}</div>
        </div>

        <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'}`}>
          <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">{isHi ? "?????? ???" : "In Progress Nodes"}</div>
          <div className="text-3xl font-black mt-1 text-amber-500">145</div>
          <div className="text-xs text-amber-600 font-bold mt-1">29% {isHi ? "?????? ?????" : "Active In-Field Progress"}</div>
        </div>

        <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'}`}>
          <div className="text-slate-400 text-xs font-bold uppercase tracking-wider">{isHi ? "??????? ??????" : "Delayed Critical Path"}</div>
          <div className="text-3xl font-black mt-1 text-red-600">38</div>
          <div className="text-xs text-red-500 font-bold mt-1">7% {isHi ? "??????? ??????" : "Requires Planner Action"}</div>
        </div>
      </div>

      {/* L1 to L6 Level Breakdown Summary Grid */}
      <div className="flex flex-col gap-3">
        <h2 className="font-extrabold text-sm uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-600" />
          {isHi ? "WBS ??????? ?????? ????????? (L1 - L6)" : "WBS Level-wise Progress Summary (L1 to L6)"}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {wbsSummary.map(item => (
            <div 
              key={item.level}
              onClick={() => setSelectedLevel(selectedLevel === item.level ? "ALL" : item.level)}
              className={`p-4 rounded-xl border transition-all cursor-pointer ${
                selectedLevel === item.level 
                  ? 'ring-2 ring-blue-600 border-blue-600 bg-blue-50/50 dark:bg-blue-900/20' 
                  : isDarkMode ? 'bg-slate-900 border-slate-800 hover:border-slate-700' : 'bg-white border-slate-200 shadow-xs hover:border-blue-300'
              }`}
            >
              <div className="flex justify-between items-center mb-2">
                <span className="font-black text-sm text-blue-600 dark:text-sky-400">{item.level}</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  {item.pct}% {isHi ? "?????" : "Done"}
                </span>
              </div>
              
              <div className="font-extrabold text-sm text-slate-900 dark:text-white mb-2 truncate">
                {item.label}
              </div>

              <div className="flex justify-between text-xs text-slate-500 font-semibold mb-1">
                <span>{item.finished} / {item.total} {isHi ? "??? ??????" : "Finished"}</span>
                <span>{item.inProgress} {isHi ? "?????? ???" : "Active"}</span>
              </div>

              <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${item.pct}%` }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filter Level Tabs & Table */}
      <div className={`rounded-xl border shadow-sm overflow-hidden flex flex-col ${
        isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 flex-wrap text-xs">
            <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" />
              {isHi ? "???? ?????:" : "Select WBS Level:"}
            </span>
            {["ALL", "L1", "L2", "L3", "L4", "L5", "L6"].map(lvl => (
              <button
                key={lvl}
                onClick={() => setSelectedLevel(lvl)}
                className={`px-3 py-1 rounded-md text-xs font-extrabold transition-all cursor-pointer ${
                  selectedLevel === lvl 
                    ? 'bg-blue-600 text-white shadow-xs' 
                    : isDarkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {lvl === "ALL" ? (isHi ? "??? ?????" : "ALL LEVELS") : lvl}
              </button>
            ))}
          </div>

          <div className="text-xs font-bold text-slate-400">
            {filteredActivities.length} {isHi ? "????? ?????????" : "Master Nodes Displayed"}
          </div>
        </div>

        {/* Master Schedule Activity Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className={`border-b ${isDarkMode ? 'bg-slate-950/80 border-slate-800 text-slate-300' : 'bg-slate-100/90 border-slate-200 text-slate-700'}`}>
              <tr>
                <th className="py-3 px-4 font-extrabold uppercase tracking-wider w-16 text-center">Level</th>
                <th className="py-3 px-4 font-extrabold uppercase tracking-wider w-36">P6 Activity ID</th>
                <th className="py-3 px-4 font-extrabold uppercase tracking-wider">Master Activity Name</th>
                <th className="py-3 px-4 font-extrabold uppercase tracking-wider w-28">Discipline</th>
                <th className="py-3 px-4 font-extrabold uppercase tracking-wider w-28">Status</th>
                <th className="py-3 px-4 font-extrabold uppercase tracking-wider w-32">Planned Dates</th>
                <th className="py-3 px-4 font-extrabold uppercase tracking-wider w-28 text-center">Progress %</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800' : 'divide-slate-200'}`}>
              {filteredActivities.map((act) => (
                <tr key={act.id} className={`transition-colors ${isDarkMode ? 'hover:bg-slate-800/60' : 'hover:bg-slate-50'}`}>
                  <td className="py-3.5 px-4 text-center">
                    <span className="font-extrabold text-blue-600 dark:text-sky-400 text-xs px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20">
                      {act.level}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-extrabold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                    {act.id}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                    {act.name}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-1 rounded text-xs font-extrabold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {act.discipline}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    {act.status === 'Finished' ? (
                      <span className="px-2.5 py-1 rounded text-xs font-extrabold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> {isHi ? "??????" : "Finished"}
                      </span>
                    ) : act.status === 'Delayed' ? (
                      <span className="px-2.5 py-1 rounded text-xs font-extrabold bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30 inline-flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> {isHi ? "???????" : "Delayed"}
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded text-xs font-extrabold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {isHi ? "?????? ??" : "In Progress"}
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                    {act.start} ? {act.finish}
                  </td>
                  <td className="py-3.5 px-4 text-center font-bold">
                    <div className="flex items-center gap-2">
                      <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${act.status === 'Finished' ? 'bg-emerald-500' : act.status === 'Delayed' ? 'bg-red-500' : 'bg-amber-500'}`} 
                          style={{ width: `${act.progress}%` }}
                        ></div>
                      </div>
                      <span className="font-mono text-xs text-slate-600 dark:text-slate-300 min-w-[32px]">{act.progress}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </main>
  );
};
