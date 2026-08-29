import React, { useState } from 'react';
import { Database, Layers, CheckCircle2, Clock, AlertTriangle, PauseCircle, RefreshCw, Download, Search, ArrowRight } from 'lucide-react';
import { useReviewQueue } from '../context/ReviewQueueContext';

export const PrimaveraP6Screen: React.FC = () => {
  const { isDarkMode, language } = useReviewQueue();
  const [selectedLevel, setSelectedLevel] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const isHi = language === 'HI';

  // Master WBS level summary data (L1 to L6)
  const wbsSummary = [
    { level: "L1", pct: "100%", finished: "1 / 1 Finished", active: "0 Active", barWidth: "100%", statusColor: "bg-emerald-600 text-white" },
    { level: "L2", pct: "95%", finished: "19 / 20 Finished", active: "1 Active", barWidth: "95%", statusColor: "bg-emerald-600 text-white" },
    { level: "L3", pct: "72%", finished: "45 / 62 Finished", active: "17 Active", barWidth: "72%", statusColor: "bg-amber-500 text-slate-950 font-bold" },
    { level: "L4", pct: "50%", finished: "120 / 240 Finished", active: "80 Active", barWidth: "50%", statusColor: "bg-amber-500 text-slate-950 font-bold" },
    { level: "L5", pct: "15%", finished: "25 / 165 Finished", active: "140 Active", barWidth: "15%", statusColor: "bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200" },
    { level: "L6", pct: "2%", finished: "4 / 200 Finished", active: "196 Active", barWidth: "2%", statusColor: "bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200" },
  ];

  // Master schedule activities with ASCII clean dates
  const masterActivities = [
    { id: "HCU3-000", level: "L1", name: isHi ? "????????????? ??????? ????? 3 ???????? ????" : "Hydrocracker Expansion Unit 3 Project Initiation", discipline: "Management", status: "Completed", start: "2024-01-01", finish: "2024-03-31", progress: 100 },
    { id: "HCU3-ENG-105", level: "L3", name: isHi ? "????? ??????? ??? ?? ??? ??????? ??????????? ??????" : "Detailed Engineering Design for Main Reactor Vessel", discipline: "Engineering", status: "In Progress", start: "2024-04-01", finish: "2024-11-15", progress: 75 },
    { id: "HCU3-CIV-202", level: "L4", name: isHi ? "???? ?? ????? ?? ??????? ????? - ??? B" : "Foundation Excavation and Piling Works - Zone B", discipline: "Civil", status: "Delayed", start: "2024-09-01", finish: "2024-12-30", progress: 40 },
    { id: "HCU3-MEC-310", level: "L5", name: isHi ? "???? ???? ??? ??????????? (E-101 A/B) ?? ???????" : "Installation of High-Pressure Heat Exchangers (E-101 A/B)", discipline: "Mechanical", status: "Not Started", start: "2025-02-15", finish: "2025-05-20", progress: 0 },
    { id: "HCU3-INS-405-A", level: "L6", name: isHi ? "???? ???????????? ?? ??? ?????? ?? ??????????" : "Loop Checking and Calibration of Flow Transmitters (FT-201 to FT-250)", discipline: "Instrumentation", status: "Not Started", start: "2025-08-01", finish: "2025-09-15", progress: 0 },
  ];

  const filteredActivities = masterActivities.filter(act => {
    const matchesLevel = selectedLevel === "ALL" || act.level === selectedLevel;
    const matchesSearch = searchQuery === "" || act.id.toLowerCase().includes(searchQuery.toLowerCase()) || act.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesLevel && matchesSearch;
  });

  return (
    <main className={`lg:ml-[240px] ml-0 mt-[56px] flex-1 overflow-y-auto p-4 lg:p-6 min-h-[calc(100vh-56px)] flex flex-col gap-6 transition-colors ${
      isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-[#f8fafc] text-slate-900'
    }`}>
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Database className="w-6 h-6" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            {isHi ? "?????????? P6 ?????? ??????? (L1 ?? L6)" : "Primavera P6 Master Schedule (L1 to L6)"}
          </h2>
          <span className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded font-mono text-xs font-bold flex items-center gap-2 shadow-xs whitespace-nowrap">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            Live P6 API (PRM-OIL-2026-HCU3)
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => window.print()}
            className={`border rounded-lg px-4 py-2 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs ${
              isDarkMode ? 'bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-200' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
            }`}
          >
            <Download className="w-4 h-4 text-blue-600" />
            {isHi ? "PDF ??????? ????" : "Export PDF"}
          </button>
        </div>
      </div>

      {/* KPI Row (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className={`border rounded-xl p-4 flex flex-col gap-1 shadow-xs ${
          isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <span className="text-[10.5px] font-black tracking-wider uppercase text-slate-400">TOTAL MASTER WBS NODES</span>
          <span className="text-3xl font-black text-blue-600 dark:text-sky-400">508</span>
        </div>

        <div className={`border rounded-xl p-4 flex flex-col gap-1 shadow-xs ${
          isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <span className="text-[10.5px] font-black tracking-wider uppercase text-slate-400">FINISHED NODES</span>
          <span className="text-3xl font-black text-emerald-500">325</span>
        </div>

        <div className={`border rounded-xl p-4 flex flex-col gap-1 shadow-xs ${
          isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <span className="text-[10.5px] font-black tracking-wider uppercase text-slate-400">IN PROGRESS NODES</span>
          <span className="text-3xl font-black text-amber-500">145</span>
        </div>

        <div className={`border rounded-xl p-4 flex flex-col gap-1 shadow-xs ${
          isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <span className="text-[10.5px] font-black tracking-wider uppercase text-slate-400">DELAYED CRITICAL PATH</span>
          <span className="text-3xl font-black text-red-600">38</span>
        </div>
      </div>

      {/* WBS Level-Wise Progress Summary (6 Cards Grid) */}
      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-600" />
          WBS Level-Wise Progress Summary
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {wbsSummary.map((item) => (
            <div 
              key={item.level}
              onClick={() => setSelectedLevel(selectedLevel === item.level ? "ALL" : item.level)}
              className={`border rounded-xl flex flex-col overflow-hidden transition-all cursor-pointer ${
                selectedLevel === item.level 
                  ? 'ring-2 ring-blue-600 border-blue-600 bg-blue-50/50 dark:bg-blue-900/20' 
                  : isDarkMode ? 'bg-slate-900 border-slate-800 hover:border-slate-700' : 'bg-white border-slate-200 shadow-xs hover:border-blue-300'
              }`}
            >
              <div className="p-3.5 flex-1 flex flex-col justify-between gap-2">
                <div className="flex justify-between items-start">
                  <span className="font-black text-lg text-blue-600 dark:text-sky-400">{item.level}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider ${item.statusColor}`}>
                    {item.pct} DONE
                  </span>
                </div>
                <div className="text-xs text-slate-500 font-bold flex flex-col gap-0.5">
                  <div>{item.finished}</div>
                  <div>{item.active}</div>
                </div>
              </div>
              <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800">
                <div className="h-full bg-emerald-500 rounded-r-full transition-all" style={{ width: item.barWidth }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Master Activity Table Section */}
      <div className={`border rounded-xl flex flex-col shadow-xs overflow-hidden ${
        isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        
        {/* Toolbar */}
        <div className={`p-4 border-b flex flex-wrap items-center gap-4 ${
          isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <span className="text-xs font-black uppercase tracking-wider text-slate-400">SELECT WBS LEVEL:</span>
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <button 
              onClick={() => setSelectedLevel("ALL")}
              className={`px-3 py-1 rounded-md font-extrabold transition-all cursor-pointer ${
                selectedLevel === "ALL" 
                  ? 'bg-blue-600 text-white shadow-xs' 
                  : isDarkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              ALL LEVELS
            </button>
            {["L1", "L2", "L3", "L4", "L5", "L6"].map(lvl => (
              <button
                key={lvl}
                onClick={() => setSelectedLevel(lvl)}
                className={`px-3 py-1 rounded-md font-extrabold transition-all cursor-pointer ${
                  selectedLevel === lvl 
                    ? 'bg-blue-600 text-white shadow-xs' 
                    : isDarkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>

          <div className="ml-auto relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Activity ID..."
              className={`w-full pl-9 pr-3 py-1.5 border rounded-md text-xs outline-none transition-colors ${
                isDarkMode ? 'bg-slate-900 border-slate-700 text-white focus:border-blue-500' : 'bg-white border-slate-200 text-slate-900 focus:border-blue-600'
              }`}
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[900px]">
            <thead className={`border-b ${
              isDarkMode ? 'bg-slate-950/90 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}>
              <tr>
                <th className="py-3 px-4 font-black uppercase tracking-wider w-16 text-center">LEVEL</th>
                <th className="py-3 px-4 font-black uppercase tracking-wider w-36">P6 ACTIVITY ID</th>
                <th className="py-3 px-4 font-black uppercase tracking-wider min-w-[320px]">MASTER ACTIVITY NAME</th>
                <th className="py-3 px-4 font-black uppercase tracking-wider w-28">DISCIPLINE</th>
                <th className="py-3 px-4 font-black uppercase tracking-wider w-32">STATUS</th>
                <th className="py-3 px-4 font-black uppercase tracking-wider w-52">PLANNED DATES</th>
                <th className="py-3 px-4 font-black uppercase tracking-wider w-40">PROGRESS %</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? 'divide-slate-800' : 'divide-slate-200'}`}>
              {filteredActivities.map((row) => (
                <tr key={row.id} className={`transition-colors ${isDarkMode ? 'hover:bg-slate-800/60' : 'hover:bg-blue-50/40'}`}>
                  <td className="py-3.5 px-4 text-center">
                    <span className="bg-blue-500/10 text-blue-600 dark:text-sky-400 px-2 py-0.5 rounded font-black text-xs border border-blue-500/20">
                      {row.level}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-extrabold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                    {row.id}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white whitespace-normal">
                    {row.name}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded text-xs font-bold border border-slate-200 dark:border-slate-700">
                      {row.discipline}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    {row.status === 'Completed' ? (
                      <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-extrabold">
                        <CheckCircle2 className="w-4 h-4" /> Completed
                      </span>
                    ) : row.status === 'Delayed' ? (
                      <span className="flex items-center gap-1.5 text-red-600 dark:text-red-400 text-xs font-extrabold">
                        <AlertTriangle className="w-4 h-4" /> Delayed
                      </span>
                    ) : row.status === 'In Progress' ? (
                      <span className="flex items-center gap-1.5 text-amber-500 text-xs font-extrabold">
                        <Clock className="w-4 h-4" /> In Progress
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-slate-400 text-xs font-bold">
                        <PauseCircle className="w-4 h-4" /> Not Started
                      </span>
                    )}
                  </td>
                  {/* Planned Dates using clean ArrowRight SVG icon - NO '?' CORRUPTION */}
                  <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span>{row.start}</span>
                      <ArrowRight className="w-3 h-3 text-slate-400" />
                      <span>{row.finish}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                            row.status === 'Completed' ? 'bg-emerald-500' : row.status === 'Delayed' ? 'bg-red-500' : 'bg-amber-500'
                          }`} 
                          style={{ width: `${row.progress}%` }}
                        ></div>
                      </div>
                      <span className={`font-mono text-xs font-extrabold min-w-[32px] ${
                        row.status === 'Delayed' ? 'text-red-600' : 'text-slate-900 dark:text-slate-100'
                      }`}>
                        {row.progress}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer / Pagination */}
        <div className={`p-3 border-t flex justify-between items-center text-xs text-slate-500 font-bold ${
          isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <span>Showing 1-5 of 508 nodes</span>
          <div className="flex gap-1">
            <button className="px-2 py-1 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-900 disabled:opacity-50 text-xs font-bold cursor-not-allowed" disabled>&lt; Prev</button>
            <button className="px-2.5 py-1 border border-blue-600 rounded bg-blue-600 text-white font-extrabold text-xs">1</button>
            <button className="px-2.5 py-1 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-900 text-xs font-bold">2</button>
            <button className="px-2.5 py-1 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-900 text-xs font-bold">3</button>
            <span className="px-1 py-1">...</span>
            <button className="px-2 py-1 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-900 text-xs font-bold">Next &gt;</button>
          </div>
        </div>

      </div>

    </main>
  );
};
